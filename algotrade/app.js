const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const open = require('open');

function extractResources(targetDir) {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(targetDir, '.trading-platform-temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // List of directories to extract
    const dirs = ['frontend', 'backend', 'live', 'mockmarket'];
    
    dirs.forEach(dir => {
        const destDir = path.join(tempDir, dir);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
            // Copy files from pkg virtual filesystem to temp directory
            copyFromPkg(dir, destDir);
        }
    });

    return tempDir;
}

function copyFromPkg(srcDir, destDir) {
    try {
        const files = require('fs').readdirSync(path.join(__dirname, srcDir));
        files.forEach(file => {
            const srcPath = path.join(__dirname, srcDir, file);
            const destPath = path.join(destDir, file);
            
            if (fs.statSync(srcPath).isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                copyFromPkg(path.join(srcDir, file), destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    } catch (err) {
        console.error(`Error copying ${srcDir}:`, err);
    }
}

function spawnServer(projectRoot, name, dir, command, args, port) {
    const serverPath = path.join(projectRoot, dir);
    
    if (!fs.existsSync(serverPath)) {
        console.error(`Error: ${dir} directory not found at ${serverPath}`);
        console.error('Current directory:', projectRoot);
        return null;
    }

    console.log(`Starting ${name} server on port ${port}...`);
    console.log(`Server path: ${serverPath}`);
    
    // Use 'npm.cmd' on Windows, 'npm' otherwise
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    // First install dependencies
    const install = spawn(npmCmd, ['install'], {
        cwd: serverPath,
        stdio: 'inherit',
        shell: true
    });

    install.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Failed to install dependencies for ${name}`);
            return;
        }

        // Start the server after installation
        const server = spawn(npmCmd, [command, ...args], {
            cwd: serverPath,
            stdio: 'inherit',
            shell: true
        });

        server.on('error', (error) => {
            console.error(`Failed to start ${name} server:`, error);
        });

        return server;
    });
}

function startAllServers() {
    // Extract resources to a temporary directory
    const tempDir = extractResources(process.cwd());
    console.log('Working directory:', tempDir);

    const servers = [
        {
            name: 'frontend',
            dir: 'frontend',
            command: 'start',
            args: [],
            port: 4300
        },
        {
            name: 'backend',
            dir: 'backend',
            command: 'start',
            args: [],
            port: 4301
        },
        {
            name: 'live',
            dir: 'live',
            command: 'start',
            args: [],
            port: 4302
        },
        {
            name: 'mock market',
            dir: 'mockmarket',
            command: 'start',
            args: [],
            port: 5555
        }
    ];

    console.log('Starting components...');

    // Start all servers
    servers.forEach(server => {
        spawnServer(
            tempDir,
            server.name,
            server.dir,
            server.command,
            server.args,
            server.port
        );
    });

    // Wait for servers to start up before opening browser
    setTimeout(async () => {
        try {
            console.log('Opening frontend in default browser...');
            await open('http://localhost:4300');
        } catch (err) {
            console.error('Failed to open browser:', err);
        }
    }, 10000); // Wait 10 seconds before opening browser

    // Handle process termination and cleanup
    const cleanup = () => {
        console.log('\nGracefully shutting down...');
        // Optional: Remove temp directory on exit
        // fs.rmSync(tempDir, { recursive: true, force: true });
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
}

startAllServers();
