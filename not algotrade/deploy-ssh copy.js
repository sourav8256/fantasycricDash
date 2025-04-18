const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

// SSH connection configuration
const config = {
  host: 'ec2-43-204-144-189.ap-south-1.compute.amazonaws.com',
  username: 'Administrator', 
  password: 'Xh&0e?Q&OAN$KN*N2Fx;-&$YpI%kjd)7',
};

// Base remote directory (Windows path) - Fix path format for Windows
const remoteBaseDir = 'C:\\Users\\Administrator\\Documents\\server\\Archive';

async function restartServices(retryCount = 3, retryDelay = 5000) {
  let currentTry = 1;

  while (currentTry <= retryCount) {
    try {
      // Connect to the remote server
      await ssh.connect({
        ...config,
        readyTimeout: 30000,
        keepaliveInterval: 10000, 
        keepaliveCountMax: 3
      });

      // Restart the server using PM2
      console.log('Restarting services...');
      console.log(`Working directory: ${remoteBaseDir}`);
      console.log(`Attempt ${currentTry} of ${retryCount}`);
      
      // Use Windows batch commands to change directory and restart PM2
      // Add timeout to wait for command completion
      const result = await ssh.execCommand('cd /d "' + remoteBaseDir + '" && pm2 restart all', {
        execOptions: {
          // Wait up to 2 minutes for command to complete
          timeout: 120000,
          // Keep connection alive during command execution
          keepaliveInterval: 2000,
          // Buffer output to handle large amounts of data
          maxBuffer: 1024 * 1024
        }
      });

      if (result.stderr) {
        console.error(`Service restart error: ${result.stderr}`);
      } else {
        // Wait a few seconds after restart to ensure services are up
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Services restarted successfully');
        
        // Get PM2 status after restart
        const statusResult = await ssh.execCommand('pm2 list', {
          execOptions: {
            timeout: 30000
          }
        });
        console.log('\nPM2 Status:');
        console.log(statusResult.stdout);
        
        return; // Exit on success
      }

    } catch (error) {
      console.error(`Failed to restart services (Attempt ${currentTry}): ${error}`);
      
      if (currentTry < retryCount) {
        console.log(`Connection failed, retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        currentTry++;
      } else {
        console.error('Max retry attempts reached. Giving up.');
        throw error; // Re-throw after all retries exhausted
      }
    } finally {
      ssh.dispose(); // Always clean up connection
    }
  }
}

// Execute the restart with retry handling
(async () => {
  try {
    await restartServices();
  } catch (error) {
    console.error(`Failed to restart services after all retries: ${error}`);
  } finally {
    // Ensure SSH connection is closed before exiting
    if (ssh.isConnected()) {
      await ssh.dispose();
    }
    process.exit(1);
  }
})();
