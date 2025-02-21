const WebSocket = require('ws');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const Strategy = require('./models/Strategy');
const DeployedStrategy = require('./models/DeployedStrategy');
const app = express();
const server = require('http').createServer(app);
const winston = require('winston');

// Configure system logger
const systemLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, 'system.log'),
            options: { flags: 'a' }
        }),
        new winston.transports.Console()
    ]
});

// Configure strategy logger
const strategyLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, 'strategy.log'),
            options: { flags: 'a' }
        })
    ]
});

// Replace console methods with winston
console.log = (msg) => systemLogger.info(typeof msg === 'object' ? JSON.stringify(msg) : msg);
console.error = (msg) => systemLogger.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);

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

// Add heartbeat interval constant near the top of the file
const HEARTBEAT_INTERVAL = 3000; // 30 seconds

// Modify the WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.subscribedSymbols = new Set();
    ws.isAlive = true;

    // Set up heartbeat response handler
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    // Send initial connection acknowledgment
    ws.send(JSON.stringify({
        event: 'connected',
        message: 'Connected to trading server',
        timestamp: new Date().toISOString()
    }));

    ws.on('message', (message) => {
        console.log('Received message from client:', message);
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

// Add heartbeat interval checker
const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
            console.log('Terminating inactive client connection');
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();

        // Send heartbeat message with subscribed symbols
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                event: 'heartbeat',
                timestamp: new Date().toISOString(),
                subscribedSymbols: Array.from(ws.subscribedSymbols)
            }));
        }
    });
}, HEARTBEAT_INTERVAL);

// Clean up interval on server close
wss.on('close', () => {
    clearInterval(heartbeat);
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
    console.log('Connecting to market feed');
    marketWs = new WebSocket('ws://localhost:5555');

    marketWs.on('open', async () => {
        console.log('Connected to market feed');
        
        // Subscribe to all symbols of deployed strategies
        const symbolsToSubscribe = new Set();
        console.log('Loaded strategies:', loadedStrategies);
        loadedStrategies.forEach(deployed => {
            if (deployed.strategyId && deployed.instrument) {
                symbolsToSubscribe.add(deployed.instrument);
                console.log(`Subscribing to ${deployed.instrument}`);
            }
        });

        symbolsToSubscribe.forEach(symbol => {
            subscribeToMarketSymbol(symbol);
        });
    });

    marketWs.on('message', async (data) => {
        // Log incoming market data messages
        try {
            console.log('Received message from market feed:');
            console.log(data.toString());
            const marketData = JSON.parse(data);
            const { symbol } = marketData;
            const { price, timestamp } = marketData.data;

            // Log the received price
            console.log(`Received price for ${symbol}: ${price} at ${timestamp}`);

            // Get subscribers for this symbol
            const subscribers = activeSymbols.get(symbol);
            if (subscribers) {
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
        strategyLogger.info(`Executing strategy ${strategy.name} for ${context.symbol} at price ${context.price}`);
        
        // Create a safe execution environment
        const strategyFunction = new Function('context', strategy.code);
        const result = await strategyFunction(context);

        // Determine buy/sell action based on strategy result
        let action = null;
        if (result && typeof result === 'object') {
            if (result.signal === 'buy') {
                action = 'buy';
            } else if (result.signal === 'sell') {
                action = 'sell';
            }
        }

        // Check risk management conditions with default values
        const {
            profitTarget = null,
            stopLoss = null,
            noTradeTime = null,
            profitManagement = 'noTrailing',
            trailStep = '400',
            profitStep = '800'
        } = strategy.riskManagement || {};

        const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
        if (noTradeTime && currentTime >= noTradeTime) {
            strategyLogger.info(`No trade time reached: ${noTradeTime}. Skipping execution.`);
            return null;
        }

        if (profitTarget && context.price >= profitTarget) {
            action = 'sell';
            strategyLogger.info(`Profit target reached: ${profitTarget}`);
        }
        if (stopLoss && context.price <= stopLoss) {
            action = 'sell';
            strategyLogger.info(`Stop loss triggered: ${stopLoss}`);
        }

        if (profitManagement === 'lockAndTrail') {
            strategyLogger.info(`Trailing with step: ${trailStep} and profit step: ${profitStep}`);
        }

        // Ensure legs is an array
        const legs = strategy.legs || [];
        for (const leg of legs) {
            console.log(`Processing leg: ${JSON.stringify(leg)}`);
        }

        // Use deployment settings with default values
        const { qtyMultiplier = 1 } = strategy.deployment || {};
        console.log(`Executing with quantity multiplier: ${qtyMultiplier}`);

        // Update strategy execution status
        await Strategy.findByIdAndUpdate(strategy._id, {
            lastExecuted: new Date(),
            lastResult: result,
            lastAction: action
        });

        if (action) {
            strategyLogger.info(`Strategy ${strategy.name} executed: ${action} signal for ${context.symbol} at ${context.price}`);
        } else {
            strategyLogger.info(`Strategy ${strategy.name} executed: no action taken`);
        }

        return {
            action,
            price: context.price,
            timestamp: context.timestamp,
            result
        };
    } catch (error) {
        strategyLogger.error(`Error executing strategy ${strategy.name}: ${error.message}`);
        return null;
    }
}

// Load deployed strategies on startup
async function loadDeployedStrategies() {
    try {
        // Load deployed strategies and populate the referenced strategy data
        loadedStrategies = await DeployedStrategy.find({})
            .populate('strategyId')
            .exec();

        console.log('Loaded strategies:');
        console.log(JSON.stringify(loadedStrategies, null, 2));
        // Filter out invalid entries
        loadedStrategies = loadedStrategies.filter(deployed => {
            if (!deployed.strategyId) {
                console.warn('Found deployed strategy with missing reference:', deployed._id);
                return false;
            }
            return true;
        });
        
        console.log(`Loaded ${loadedStrategies.length} valid deployed strategies`);
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

        strategyLogger.info(`Executing strategies for symbol: ${symbol}`);
        
        // Filter loaded strategies for the given symbol, with null checks
        const symbolStrategies = loadedStrategies.filter(deployed => {
            if (!deployed || !deployed.strategyId) {
                strategyLogger.warn(`Found invalid deployed strategy: ${JSON.stringify(deployed)}`);
                return false;
            }
            strategyLogger.info(`Deployed strategy: ${JSON.stringify(deployed)} ${deployed.instrument} ${symbol}`);
            return deployed.instrument === symbol;
        });

        if (symbolStrategies.length === 0) {
            strategyLogger.debug(`No strategies found for symbol: ${symbol}`);
            return;
        }

        strategyLogger.info(`Symbol strategies: ${JSON.stringify(symbolStrategies)}`);

        const context = createStrategyContext(symbol, price, timestamp);

        for (const deployed of symbolStrategies) {
            if (deployed.strategyId) {
                try {
                    const result = await executeStrategy(deployed.strategyId, context);
                    strategyLogger.info(`Strategy execution result for ${deployed.strategyId.name}: ${JSON.stringify(result)}`);
                } catch (error) {
                    strategyLogger.error(`Error executing strategy ${deployed.strategyId.name}: ${error.message}`);
                }
            } else {
                strategyLogger.error(`Deployed strategy not found: ${JSON.stringify(deployed)}`);
            }
        }
    } catch (error) {
        strategyLogger.error(`Error executing strategies: ${error.message}`);
    }
}

// Add these routes near other express routes
app.delete('/api/deployed-strategies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find and delete the deployed strategy
        const deletedStrategy = await DeployedStrategy.findByIdAndDelete(id);
        
        if (!deletedStrategy) {
            return res.status(404).json({ message: 'Deployed strategy not found' });
        }

        // Remove from loaded strategies array
        loadedStrategies = loadedStrategies.filter(strategy => 
            strategy._id.toString() !== id
        );

        console.log(`Deployed strategy ${id} deleted successfully`);
        res.json({ message: 'Strategy deleted successfully' });
    } catch (error) {
        console.error('Error deleting deployed strategy:', error);
        res.status(500).json({ 
            message: 'Error deleting strategy',
            error: error.message 
        });
    }
});

// Add GET endpoint for deployed strategies if not already present
app.get('/api/deployed-strategies', async (req, res) => {
    try {
        // Return the in-memory loaded strategies
        res.json(loadedStrategies);
    } catch (error) {
        console.error('Error fetching deployed strategies:', error);
        res.status(500).json({ 
            message: 'Error fetching strategies',
            error: error.message 
        });
    }
});

// Start the server
const PORT = process.env.PORT || 4302;
server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await loadDeployedStrategies();
    connectToMarketFeed();
}); 