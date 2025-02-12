const WebSocket = require('ws');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const Strategy = require('./models/Strategy');

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

// Load and execute strategies for a symbol
async function executeStrategies(symbol, price, timestamp) {
    try {
        const strategies = await Strategy.find({
            symbol: symbol,
            isActive: true
        });

        const context = createStrategyContext(symbol, price, timestamp);

        for (const strategy of strategies) {
            await executeStrategy(strategy, context);
        }
    } catch (error) {
        console.error('Error executing strategies:', error);
    }
}

// Update simulateMarketData function
function simulateMarketData() {
    setInterval(async () => {
        for (const [symbol, subscribers] of activeSymbols) {
            const mockData = {
                type: 'price_update',
                symbol: symbol,
                price: Math.random() * 1000 + 19000,
                timestamp: new Date().toISOString()
            };
            
            // Execute strategies for this symbol
            await executeStrategies(symbol, mockData.price, mockData.timestamp);
            
            // Broadcast to all subscribers of this symbol
            subscribers.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(mockData));
                }
            });
        }
    }, 1000);
}

// Add API endpoints for strategy management
app.use(express.json());

// Get all strategies
app.get('/api/strategies', async (req, res) => {
    try {
        const strategies = await Strategy.find();
        res.json(strategies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new strategy
app.post('/api/strategies', async (req, res) => {
    try {
        const strategy = new Strategy(req.body);
        await strategy.save();
        res.status(201).json(strategy);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update strategy
app.put('/api/strategies/:id', async (req, res) => {
    try {
        const strategy = await Strategy.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(strategy);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete strategy
app.delete('/api/strategies/:id', async (req, res) => {
    try {
        await Strategy.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 4302;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    simulateMarketData();
}); 