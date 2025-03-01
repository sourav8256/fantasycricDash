const { NodeSSH } = require('node-ssh');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const ignore = require('ignore');

// Load environment variables from the same directory as this script
dotenv.config({ path: path.join(__dirname, '.env') });

const ssh = new NodeSSH();

// SSH connection configuration
const config = {
  host: 'ec2-43-204-144-189.ap-south-1.compute.amazonaws.com',
  username: 'Administrator',
  password: 'Xh&0e?Q&OAN$KN*N2Fx;-&$YpI%kjd)7',
};

// Base remote directory (Windows path)
const remoteBaseDir = process.env.REMOTE_DIR || 'C:\\Users\\Administrator\\Documents\\server\\Archive';

// Default ignore patterns for security and cleanliness
const defaultIgnores = [
  '.git',        // Never deploy git repository data
  '.env',        // Never deploy environment files for security
  '**/node_modules/**'  // Never deploy dependencies
];

// Setup logging
async function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}\n`;
  
  // Log to console
  console.log(logMessage);
  
  // Log to file
  try {
    await fs.appendFile('deploy.log', logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

async function readGitignore(dir) {
  try {
    const gitignorePath = path.join(dir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    return content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  } catch (error) {
    return [];
  }
}

async function getFilesRecursively(baseDir) {
  const files = new Map();
  const baseIgnore = ignore().add(defaultIgnores);
  
  async function scan(directory) {
    // Read local .gitignore
    const localIgnores = await readGitignore(directory);
    const ig = ignore().add(defaultIgnores).add(localIgnores);

    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      // Skip if file is ignored by base rules
      if (baseIgnore.ignores(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        // Skip if file is ignored by local .gitignore
        if (!ig.ignores(entry.name)) {
          files.set(fullPath, relativePath);
        }
      }
    }
  }

  await scan(baseDir);
  return files;
}

async function deploy(retryCount = 3, retryDelay = 5000) {
  let currentTry = 1;
  
  while (currentTry <= retryCount) {
    try {
      await log('Starting deployment...');
      await log(`Remote directory: ${remoteBaseDir}`);
      await log(`Attempt ${currentTry} of ${retryCount}`);
      
      // Connect to the remote server with timeout
      await log(`Connecting to ${config.host}...`);
      await ssh.connect({
        ...config,
        readyTimeout: 30000,    // 30 seconds timeout for connection
        keepaliveInterval: 10000, // Send keepalive every 10 seconds
        keepaliveCountMax: 3     // Allow 3 missed keepalives before failing
      });
      await log('Connected to remote server');

      // Get all files recursively from current directory
      await log('Scanning local files...');
      const files = await getFilesRecursively(__dirname);
      await log(`Found ${files.size} files to process`);
      
      let transferred = 0;
      let failed = 0;

      // Deploy files
      for (const [localPath, relativePath] of files) {
        const remotePath = path.join(remoteBaseDir, relativePath).replace(/\\/g, '\\\\');
        
        try {
          // Ensure remote directory exists
          const remoteFileDir = path.dirname(remotePath);
          await ssh.execCommand(`if not exist "${remoteFileDir}" mkdir "${remoteFileDir}"`);
          
          // Transfer file
          await ssh.putFile(localPath, remotePath);
          await log(`Transferred: ${relativePath}`, 'success');
          transferred++;
        } catch (error) {
          await log(`Failed to transfer ${relativePath}: ${error}`, 'error');
          failed++;
        }
      }

      // Log deployment statistics
      await log('Deployment statistics:', 'summary');
      await log(`- Files transferred: ${transferred}`, 'summary');
      await log(`- Files failed: ${failed}`, 'summary');

      // Restart the server using Windows batch commands
      await log('Restarting services...');
      const result = await ssh.execCommand('cd /d "' + remoteBaseDir + '" && pm2 restart all', {
        execOptions: {
          timeout: 120000,
          keepaliveInterval: 2000,
          maxBuffer: 1024 * 1024
        }
      });

      if (result.stderr) {
        await log(`Service restart error: ${result.stderr}`, 'error');
      } else {
        // Wait a few seconds after restart to ensure services are up
        await new Promise(resolve => setTimeout(resolve, 5000));
        await log('Services restarted successfully');
        
        // Get PM2 status after restart
        const statusResult = await ssh.execCommand('pm2 list', {
          execOptions: {
            timeout: 30000
          }
        });
        await log('\nPM2 Status:', 'info');
        await log(statusResult.stdout, 'info');
      }

      await log('Deployment completed successfully!', 'success');
      return; // Exit successfully
      
    } catch (error) {
      await log(`Failed to deploy (Attempt ${currentTry}): ${error}`, 'error');
      
      if (currentTry < retryCount) {
        await log(`Connection failed, retrying in ${retryDelay/1000} seconds...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        currentTry++;
      } else {
        await log('Max retry attempts reached. Giving up.', 'error');
        throw error; // Re-throw after all retries are exhausted
      }
    } finally {
      ssh.dispose(); // Always clean up connection
    }
  }
}

// Execute the deployment with retry handling
(async () => {
  try {
    await deploy();
  } catch (error) {
    await log(`Failed to deploy after all retries: ${error}`, 'error');
  } finally {
    // Ensure SSH connection is closed before exiting
    if (ssh.isConnected()) {
      await ssh.dispose();
    }
    process.exit(1);
  }
})();
