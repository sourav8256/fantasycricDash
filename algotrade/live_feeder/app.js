// fyers_stream.js

const crypto = require('crypto');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const FyersAPI = require("fyers-api-v3").fyersModel;
const FyersSocket = require("fyers-api-v3").fyersDataSocket;

// Load environment variables
dotenv.config();

// Get credentials from environment variables with fallbacks for development
const appId = process.env.FYERS_APP_ID || 'UNSMKLB9KY-100';  
const appSecret = process.env.FYERS_APP_SECRET || 'Q4DL9ZK5OP';
const redirectUri = process.env.FYERS_REDIRECT_URI; 
const authCode = process.env.FYERS_AUTH_CODE;

// Generate SHA-256 hash of appId and appSecret
const appIdHash = crypto.createHash('sha256').update(appId + appSecret).digest('hex');
console.log('Using appId:', appId);
console.log('Generated appIdHash:', appIdHash);

// Function to start auth server if needed
async function ensureAuthentication() {
    // Check if we have valid auth parameters
    if (!authCode || authCode === 'your_current_authorization_code') {
        console.log('No valid auth code found. Starting authentication server...');
        
        // Check if express is installed
        try {
            require.resolve('express');
        } catch (e) {
            console.error('Express package is required for authentication server.');
            console.error('Please install it with: npm install express');
            process.exit(1);
        }
        
        // Start auth server in a child process
        const authServer = spawn('node', [path.join(__dirname, 'auth-server.js')], {
            stdio: 'inherit'
        });
        
        console.log('\nPlease complete the authentication in your browser.');
        console.log('Once authenticated, the app will continue automatically.\n');
        
        // Wait for auth to complete by checking .env file periodically
        return new Promise((resolve) => {
            const checkAuth = () => {
                try {
                    // Reload .env file
                    const envPath = path.join(__dirname, '.env');
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const match = envContent.match(/FYERS_AUTH_CODE=([^\r\n]+)/);
                    
                    if (match && match[1] && match[1] !== 'your_current_authorization_code') {
                        console.log('Authentication completed. Continuing with the app...');
                        
                        // Kill the auth server
                        authServer.kill();
                        
                        // Reload environment variables
                        Object.keys(process.env).forEach(key => {
                            if (key.startsWith('FYERS_')) {
                                delete process.env[key];
                            }
                        });
                        dotenv.config();
                        
                        resolve();
                    } else {
                        // Check again after 2 seconds
                        setTimeout(checkAuth, 2000);
                    }
                } catch (error) {
                    console.error('Error checking auth status:', error.message);
                    setTimeout(checkAuth, 2000);
                }
            };
            
            // Start checking
            checkAuth();
        });
    }
    
    // Already authenticated
    return Promise.resolve();
}

// Function to obtain access token
async function getAccessToken() {
    try {
        // Create a new instance of FyersAPI
        var fyers = new FyersAPI();
        
        // Set your APPID obtained from Fyers
        fyers.setAppId(appId);
        
        // Set the RedirectURL where the authorization code will be sent
        fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);
        
        // Define the authorization code and secret key required for generating access token
        const auth_code = process.env.FYERS_AUTH_CODE;
        const secretKey = process.env.FYERS_APP_SECRET;
        
        console.log('Generating access token with:', {
            appId,
            redirectUri: process.env.FYERS_REDIRECT_URI,
            authCode: auth_code ? auth_code.substring(0, 15) + '...' : 'undefined'
        });
        
        const response = await fyers.generate_access_token({
            "secret_key": secretKey,
            "auth_code": auth_code
        });
        
        if (response && response.s === 'error') {
            throw new Error(`Fyers API error: ${response.message || 'Unknown error'}`);
        }
        console.log(response);
        console.log('Successfully obtained access token');
        return response.access_token;
    } catch (error) {
        console.error('Error obtaining access token:');
        
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            
            // Provide helpful guidance based on common error codes
            if (error.response.status === 500) {
                console.error('\nPossible solutions:');
                console.error('1. Check if your auth code is valid and not expired');
                console.error('2. Verify your redirect URI matches exactly what is registered with Fyers');
                console.error('3. Ensure your app ID and app secret are correct');
            }
        } else {
            console.error(error.message);
        }
        
        throw error;
    }
}

// Function to stream market data using the official Fyers Socket API
async function streamMarketData() {
    try {
        // Ensure we have authentication
        await ensureAuthentication();
        
        // Get access token
        const accessToken = await getAccessToken();
        console.log('Access token obtained, connecting to data socket...');
        
        // Initialize Fyers data socket with access token
        const fyersdata = new FyersSocket(`${appId}:${accessToken}`);
        
        // Define event handlers
        function onmsg(message) {
            console.log('Market Data:', message);
        }
        
        function onconnect() {
            console.log('Connected to Fyers WebSocket');
            // Subscribe to SBIN symbol
            fyersdata.subscribe(['NSE:SBIN-EQ']);
            console.log('Subscribed to NSE:SBIN-EQ');
            
            // Enable auto reconnection
            fyersdata.autoreconnect();
            console.log('Auto-reconnect enabled');
            
            // Optionally set data mode (default is FullMode)
            // fyersdata.mode(fyersdata.LiteMode); // For lite mode
            // fyersdata.mode(fyersdata.FullMode); // For full mode
        }
        
        function onerror(err) {
            console.error('WebSocket Error:', err);
        }
        
        function onclose() {
            console.log('Connection closed.');
        }
        
        // Register event handlers
        fyersdata.on("message", onmsg);
        fyersdata.on("connect", onconnect);
        fyersdata.on("error", onerror);
        fyersdata.on("close", onclose);
        
        // Connect to the socket
        fyersdata.connect();
        
    } catch (error) {
        console.error('Failed to start streaming market data:', error.message);
    }
}

// Start streaming market data
streamMarketData();
