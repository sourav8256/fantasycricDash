// Simple express server to handle Fyers API authentication
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FyersAPI = require("fyers-api-v3").fyersModel;
require('dotenv').config();

// Load credentials from .env
const appId = process.env.FYERS_APP_ID;
const appSecret = process.env.FYERS_APP_SECRET;
const redirectUri = process.env.FYERS_REDIRECT_URI;
const PORT = 3000;

// Create express app
const app = express();

// Create a new instance of FyersAPI
var fyers = new FyersAPI();

// Home page with login link
app.get('/', (req, res) => {
  const clientId = appId.includes('-') ? appId : `${appId}-100`;
  
  // Set your APPID obtained from Fyers
  fyers.setAppId(clientId);
  
  // Set the RedirectURL where the authorization code will be sent
  fyers.setRedirectUrl(redirectUri);
  
  // Generate the URL to initiate the OAuth2 authentication process
  var generateAuthcodeURL = fyers.generateAuthCode();
  
  console.log(generateAuthcodeURL);
  
  res.send(`
    <h1>Fyers API Authentication</h1>
    <a href="${generateAuthcodeURL}" target="_blank">Login to Fyers</a>
  `);
});

// Callback endpoint that receives the authorization code
app.get('/fyers-callback', async (req, res) => {
  console.log('Received authorization code:', req.query.code);
  const { code } = req.query;
  
  if (!code) {
    console.error('No authorization code received');
    return res.status(400).send('Error: No authorization code received');
  }

  try {
    // Update the .env file with the new auth code
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the auth code line or add it if it doesn't exist
    if (envContent.includes('FYERS_AUTH_CODE=')) {
      envContent = envContent.replace(/FYERS_AUTH_CODE=.*(\r?\n|$)/g, `FYERS_AUTH_CODE=${code}$1`);
    } else {
      envContent += `\nFYERS_AUTH_CODE=${code}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    res.send(`
      <h1>Authentication Successful!</h1>
      <p>Your authentication code is: <strong>${code}</strong></p>
      <p>The .env file has been updated. You can close this window now.</p>
    `);
    
  } catch (error) {
    console.error('Error updating .env file:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Fyers Authentication Server running on http://localhost:${PORT}`);
  console.log(`Please visit http://localhost:${PORT} to authenticate with Fyers`);
}); 
