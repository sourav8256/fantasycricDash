const WebSocket = require('ws');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const Strategy = require('./models/Strategy');
const DeployedStrategy = require('./models/DeployedStrategy');
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

// Store loaded strategies in memory for runtime access
let loadedStrategies = [];

// Store market feed connection
let marketWs;

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

// Connect to mock market feed
function connectToMarketFeed() {
    marketWs = new WebSocket('ws://localhost:5555');

    marketWs.on('open', () => {
        console.log('Connected to market feed');
        // Subscribe to all active symbols
        for (const symbol of activeSymbols.keys()) {
            subscribeToMarketSymbol(symbol);
        }
    });

    marketWs.on('message', async (data) => {
        // Log incoming market data messages
        try {
            const marketData = JSON.parse(data);
            const { symbol, price, timestamp } = marketData;

            // Get subscribers for this symbol
            const subscribers = activeSymbols.get(symbol);
            if (subscribers) {
                // console.log('Subscribers for symbol:', symbol, subscribers);

                // Forward market data to all subscribers
                subscribers.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        console.log('Sent data to client:', marketData);
                        client.send(JSON.stringify(marketData));
                    }
                });
            }

                // Execute strategies for this symbol
                await executeStrategies(symbol, price, timestamp);
                
                
        } catch (error) {
            console.error('Error processing market data:', error);
        }
    });

    marketWs.on('close', () => {
        console.log('Disconnected from market feed - attempting to reconnect...');
        setTimeout(connectToMarketFeed, 1000);
    });

    marketWs.on('error', (error) => {
        console.error('Market feed error:', error);
    });
}

// Subscribe to symbol in market feed
function subscribeToMarketSymbol(symbol) {
    if (marketWs && marketWs.readyState === WebSocket.OPEN) {
        marketWs.send(JSON.stringify({
            action: 'subscribe',
            symbols: [symbol]
        }));
        console.log(`Subscribed to market feed for ${symbol}`);
    }
}

function subscribeToSymbol(symbol, ws) {
    if (!activeSymbols.has(symbol)) {
        activeSymbols.set(symbol, new Set());
        // Subscribe to market feed for new symbols
        subscribeToMarketSymbol(symbol);
    }
    activeSymbols.get(symbol).add(ws);
    ws.subscribedSymbols.add(symbol);
}

function unsubscribeFromSymbol(symbol, ws) {
    const subscribers = activeSymbols.get(symbol);
    if (subscribers) {
        subscribers.delete(ws);
        ws.subscribedSymbols.delete(symbol);
        if (subscribers.size === 0) {
            activeSymbols.delete(symbol);
            // Unsubscribe from market feed when no clients are subscribed
            if (marketWs && marketWs.readyState === WebSocket.OPEN) {
                marketWs.send(JSON.stringify({
                    type: 'unsubscribe',
                    symbol: symbol
                }));
                console.log(`Unsubscribed from market feed for ${symbol}`);
            }
        }
    }
    console.log(`Client unsubscribed from ${symbol}`);
}

// Strategy execution context
function createStrategyContext(symbol, price, timestamp) {
    return {
        symbol,
        price,
        timestamp,
        // Add any other market data or indicators needed by strategies
        getHistoricalData: async () => {
            // TODO: Implement historical data retrieval
            return [];
        }
    };
}

// Execute a single strategy
async function executeStrategy(strategy, context) {
    try {
        // Create a safe execution environment
        const strategyFunction = new Function('context', strategy.code);
        const result = await strategyFunction(context);
        
        // Update strategy execution status
        await Strategy.findByIdAndUpdate(strategy._id, {
            lastExecuted: new Date(),
            lastResult: result
        });

        console.log(`Strategy ${strategy.name} executed:`, result);
        return result;
    } catch (error) {
        console.error(`Error executing strategy ${strategy.name}:`, error);
        return null;
    }
}

// Load deployed strategies on startup
async function loadDeployedStrategies() {
    try {
        // Load deployed strategies and populate the referenced strategy data
        loadedStrategies = await DeployedStrategy.find({})
            .populate('strategyId');
        
        console.log(`Loaded ${loadedStrategies.length} deployed strategies`);
        return loadedStrategies;
    } catch (error) {
        console.error('Error loading deployed strategies:', error);
        return [];
    }
}

// Add endpoint to view loaded strategies
app.get('/deployed-strategies', (req, res) => {
    res.json(loadedStrategies);
});

// Update executeStrategies function to use loaded strategies
async function executeStrategies(symbol, price, timestamp) {
    try {
        // Filter loaded strategies for the given symbol
        const symbolStrategies = loadedStrategies.filter(
            deployed => deployed.strategyId.symbol === symbol
        );

        const context = createStrategyContext(symbol, price, timestamp);

        for (const deployed of symbolStrategies) {
            await executeStrategy(deployed.strategyId, context);
        }
    } catch (error) {
        console.error('Error executing strategies:', error);
    }
}

// Start the server
const PORT = process.env.PORT || 4302;
server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await loadDeployedStrategies();
    connectToMarketFeed();
}); 