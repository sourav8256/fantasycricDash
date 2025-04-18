const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Get configuration from environment variables with fallbacks
const PORT = process.env.PORT || '4300';
const HOST = process.env.HOST || '0.0.0.0';

// Log configuration on startup
console.log('Server Configuration:', {
    PORT,
    HOST
});

// Middleware to allow iframe loading
app.use((req, res, next) => {
    // Remove X-Frame-Options header to allow iframe loading
    res.removeHeader('X-Frame-Options');
    // Set Content-Security-Policy to allow same-origin iframes
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    next();
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname)));

// Serve files from pages directory
app.use('/pages', express.static(path.join(__dirname, 'pages')));

// Serve CSS files with correct MIME type
app.use('/css', express.static(path.join(__dirname, 'css'), {
    setHeaders: (res) => res.setHeader('Content-Type', 'text/css')
}));

// Serve env.js and config.js from root
app.get('/env.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'env.js'));
});

app.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'config.js'));
});

// Handle all routes by serving index.html
app.get('*', (req, res) => {
    if (req.path.startsWith('/pages/')) {
        res.sendFile(path.join(__dirname, req.path));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`Frontend server running on http://${HOST}:${PORT}`);
}); 