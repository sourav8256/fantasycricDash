const WebSocket = require('ws');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Test page route
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

// Store active symbols and their subscribers
const activeSymbols = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.subscribedSymbols = new Set();

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(data, ws);
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Clean up subscriptions
        ws.subscribedSymbols.forEach(symbol => {
            const subscribers = activeSymbols.get(symbol);
            if (subscribers) {
                subscribers.delete(ws);
                if (subscribers.size === 0) {
                    activeSymbols.delete(symbol);
                }
            }
        });
    });
});

// Message handler
function handleMessage(data, ws) {
    switch (data.type) {
        case 'subscribe':
            subscribeToSymbol(data.symbol, ws);
            break;
        case 'unsubscribe':
            unsubscribeFromSymbol(data.symbol, ws);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

function subscribeToSymbol(symbol, ws) {
    if (!activeSymbols.has(symbol)) {
        activeSymbols.set(symbol, new Set());
    }
    activeSymbols.get(symbol).add(ws);
    ws.subscribedSymbols.add(symbol);
    console.log(`Client subscribed to ${symbol}`);
}

function unsubscribeFromSymbol(symbol, ws) {
    const subscribers = activeSymbols.get(symbol);
    if (subscribers) {
        subscribers.delete(ws);
        ws.subscribedSymbols.delete(symbol);
        if (subscribers.size === 0) {
            activeSymbols.delete(symbol);
        }
    }
    console.log(`Client unsubscribed from ${symbol}`);
}

// Mock function to simulate market data
function simulateMarketData() {
    setInterval(() => {
        activeSymbols.forEach((subscribers, symbol) => {
            const mockData = {
                type: 'price_update',
                symbol: symbol,
                price: Math.random() * 1000 + 19000,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to all subscribers of this symbol
            subscribers.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(mockData));
                }
            });
        });
    }, 1000);
}

// Start the server
const PORT = process.env.PORT || 4302;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    simulateMarketData();
}); 