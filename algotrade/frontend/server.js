const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

// Middleware to allow iframe loading
app.use((req, res, next) => {
    // Remove X-Frame-Options header to allow iframe loading
    res.removeHeader('X-Frame-Options');
    // Set Content-Security-Policy to allow same-origin iframes
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    next();
});

// Proxy /api requests to backend server
app.use('/api', createProxyMiddleware({ 
    target: 'http://localhost:4301',
    changeOrigin: true
}));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname)));

// Serve files from pages directory
app.use('/pages', express.static(path.join(__dirname, 'pages')));

// Serve CSS files with correct MIME type
app.use('/css', express.static(path.join(__dirname, 'css'), {
    setHeaders: (res, path) => {
        res.setHeader('Content-Type', 'text/css');
    }
}));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
    if (req.path.startsWith('/pages/')) {
        const pagePath = path.join(__dirname, req.path);
        res.sendFile(pagePath);
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

const PORT = process.env.PORT || 4300;
app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
}); 