// fyers_stream.js

const crypto = require('crypto');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const FyersAPI = require("fyers-api-v3").fyersModel;
const FyersSocket = require("fyers-api-v3").fyersDataSocket;
const WebSocket = require('ws');
const http = require('http');
const { openUrl } = require('./browser_automation');


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
        var fyers = new FyersAPI({
            enable_session: false
        });
        
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
            console.log(response)
            openUrl(`https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${appId}&redirect_uri=http://google.com&response_type=code&state=sample_state`);

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
    // Create a WebSocket server directly without http
    const PORT = process.env.WS_PORT || 5555;
    const wss = new WebSocket.Server({ port: PORT });
    
    console.log(`WebSocket server listening on ws://localhost:${PORT}`);
    
    // Keep track of clients and their subscriptions
    const clients = new Map();
    
    // Flag to track if we have a valid Fyers connection
    let hasFyersConnection = false;
    let fyersdata = null;
    
    // WebSocket server connection handler
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket server');
        
        // Store client connection with empty subscriptions array
        clients.set(ws, { 
            subscriptions: [] 
        });
        
        // Send connection confirmation according to protocol
        ws.send(JSON.stringify({
            event: "connected",
            message: hasFyersConnection ? 
                "Connected to market data stream" : 
                "Connected to server. WARNING: No connection to market data source."
        }));
        
        // Handle messages from clients
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('Received message from client:', data);
                
                // Handle subscription requests
                if (data.action === 'subscribe' && Array.isArray(data.symbols)) {
                    // Get client info
                    const clientInfo = clients.get(ws);
                    
                    // Update client's subscriptions
                    clientInfo.subscriptions = [...new Set([
                        ...clientInfo.subscriptions,
                        ...data.symbols.map(symbol => symbol.toUpperCase())
                    ])];
                    
                    // Save updated client info
                    clients.set(ws, clientInfo);
                    
                    // Send subscription confirmation to client
                    ws.send(JSON.stringify({
                        event: "subscribed",
                        symbols: data.symbols,
                        message: `Subscribed to ${data.symbols.join(', ')}`
                    }));
                    
                    console.log('Client subscribed to symbols:', data.symbols);
                    
                    // Subscribe to these symbols in Fyers if connected
                    if (hasFyersConnection && fyersdata) {
                        // Convert to Fyers symbol format (assuming NSE exchange and EQ market type)
                        const fyersSymbols = data.symbols.map(symbol => `NSE:${symbol}-EQ`);
                        fyersdata.subscribe(fyersSymbols);
                    } else {
                        console.log('Note: Fyers connection not available, subscription only tracked locally');
                    }
                }
                
                // Handle unsubscribe requests
                if (data.action === 'unsubscribe' && Array.isArray(data.symbols)) {
                    // Get client info
                    const clientInfo = clients.get(ws);
                    
                    // Update client's subscriptions by removing unsubscribed symbols
                    const symbolsToRemove = data.symbols.map(symbol => symbol.toUpperCase());
                    clientInfo.subscriptions = clientInfo.subscriptions.filter(
                        symbol => !symbolsToRemove.includes(symbol)
                    );
                    
                    // Save updated client info
                    clients.set(ws, clientInfo);
                    
                    // Send unsubscription confirmation to client
                    ws.send(JSON.stringify({
                        event: "unsubscribed",
                        symbols: data.symbols,
                        message: `Unsubscribed from ${data.symbols.join(', ')}`
                    }));
                    
                    console.log('Client unsubscribed from symbols:', data.symbols);
                }
            } catch (error) {
                console.error('Error processing client message:', error);
                // Send error message to client according to protocol
                ws.send(JSON.stringify({
                    error: "Invalid message format"
                }));
            }
        });
        
        // Handle client disconnection
        ws.on('close', () => {
            console.log('Client disconnected from WebSocket server');
            clients.delete(ws);
        });
    });
    
    // Try to connect to Fyers in parallel
    try {
        // Ensure we have authentication
        await ensureAuthentication();
        
        // Get access token
        const accessToken = await getAccessToken();
        console.log('Access token obtained, connecting to data socket...');
        
        // Initialize Fyers data socket with access token
        fyersdata = new FyersSocket(`${appId}:${accessToken}`,"",false);
        
        // Define event handlers for Fyers WebSocket
        function onmsg(message) {
            console.log('Market Data:', message);
            
            // Process and forward market data to all clients that have subscribed to the symbol
            // try {
                // Parse the Fyers data - it's an object, not an array
                if (message && message.symbol) {
                    // Extract symbol from Fyers format (NSE:SBIN-EQ -> SBIN)
                    const parts = message.symbol.split(':');
                    if (parts.length >= 2) {
                        const symbolParts = parts[1].split('-');
                        const symbol = symbolParts[0];
                        
                        // Prepare protocol-compliant message
                        const priceUpdateMsg = {
                            event: "price_update",
                            symbol: symbol,
                            data: {
                                price: message.ltp || 0,
                                volume: message.vol_traded_today || 0,
                                timestamp: new Date().toISOString()
                            }
                        };
                        
                        // Send to all subscribed clients
                        clients.forEach((clientInfo, ws) => {
                            // Check if client is subscribed to this symbol
                            if (clientInfo.subscriptions.includes(symbol)) {
                                if (ws.readyState === WebSocket.OPEN) {
                                console.log('Sending price update to client:', priceUpdateMsg);
                                    ws.send(JSON.stringify(priceUpdateMsg));
                                }
                            }
                        });
                    }
                }
            // } catch (error) {
            //     console.error('Error processing and forwarding market data:', error);
            // }
        }
        
        function onconnect() {
            console.log('Connected to Fyers WebSocket');
            hasFyersConnection = true;
            
            // Subscribe to SBIN symbol
            // fyersdata.subscribe(['NSE:SBIN-EQ']);
            // console.log('Subscribed to NSE:SBIN-EQ');
            
            // Enable auto reconnection
            fyersdata.autoreconnect();
            console.log('Auto-reconnect enabled');
        }
        
        function onerror(err) {
            console.error('Fyers WebSocket Error:', err);
            hasFyersConnection = false;
        }
        
        function onclose() {
            console.log('Fyers connection closed.');
            hasFyersConnection = false;
        }
        
        // Register event handlers
        fyersdata.on("message", onmsg);
        fyersdata.on("connect", onconnect);
        fyersdata.on("error", onerror);
        fyersdata.on("close", onclose);
        
        // Connect to the Fyers socket
        fyersdata.connect();
        
    } catch (error) {
        console.error('Failed to connect to Fyers data service:', error.message);
        console.log('WebSocket server will run without market data - NO DUMMY DATA WILL BE GENERATED');
        
        // Previously there was mock data generation here - REMOVED
    }
}

// Start streaming market data
streamMarketData();
