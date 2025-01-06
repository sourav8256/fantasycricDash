const WebSocket = require('ws');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Create WebSocket server
const wss = new WebSocket.Server({ port: 3001 });

// Store active strategies
const activeStrategies = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(data, ws);
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
});

// Message handler
function handleMessage(data, ws) {
    switch (data.type) {
        case 'start_strategy':
            startStrategy(data.strategyId);
            break;
        case 'stop_strategy':
            stopStrategy(data.strategyId);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Strategy management functions
function startStrategy(strategyId) {
    // Implementation for starting a strategy
    // This would involve loading the strategy from the database
    // and setting up the execution loop
}

function stopStrategy(strategyId) {
    // Implementation for stopping a strategy
    const strategy = activeStrategies.get(strategyId);
    if (strategy) {
        strategy.status = 'stopped';
        console.log(`Strategy ${strategyId} stopped`);
    }
}

// Mock function to simulate receiving broker data
// In production, this would be replaced with actual broker integration
function simulateBrokerData() {
    setInterval(() => {
        const mockData = {
            symbol: 'NIFTY',
            price: Math.random() * 1000 + 19000,
            timestamp: new Date().toISOString()
        };
        
        // Process the data through active strategies
        processMarketData(mockData);
    }, 1000);
}

function processMarketData(data) {
    activeStrategies.forEach((strategy, strategyId) => {
        if (strategy.status === 'active') {
            // Execute strategy logic here
            // This is where you would implement the actual trading logic
            const signal = evaluateStrategy(strategy, data);
            if (signal) {
                executeTrade(signal, strategy, data);
            }
        }
    });
}

function evaluateStrategy(strategy, data) {
    // Implement strategy evaluation logic
    // Return trading signal if conditions are met
    return null;
}

function executeTrade(signal, strategy, data) {
    const trade = {
        strategy: strategy.name,
        action: signal.action,
        symbol: data.symbol,
        price: data.price,
        timestamp: new Date().toISOString()
    };
    
    console.log('Trade executed:', trade);
}

console.log('Live trading server started on port 3001');

// Start the mock data simulation
simulateBrokerData(); 