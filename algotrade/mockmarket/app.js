const express = require('express');
const app = express();
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || 5555;

// Add this near the top to handle paths in production
const isDev = process.env.NODE_ENV !== 'production';
const publicPath = isDev ? 
    path.join(__dirname, 'public') : 
    path.join(process.execPath, '..', 'public');

// Add static file serving
app.use(express.static(publicPath));

// Store some mock data
let mockStocks = {
    'AAPL': { price: 150.0, volume: 1000000 },
    'GOOGL': { price: 2800.0, volume: 500000 },
    'MSFT': { price: 280.0, volume: 750000 },
    'AMZN': { price: 3300.0, volume: 400000 },
    'TSLA': { price: 900.0, volume: 600000 }
};

// Store active trades
let activeTrades = {};

// Track connected clients and their subscriptions
const clients = new Map();

// Generate a unique trade ID
function generateTradeId() {
    return Math.random().toString(36).substr(2, 9);
}

// Add logging function
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    fs.appendFileSync(path.join(__dirname, 'system.log'), logMessage);
}

// Modify handleSubscribe to add new symbols dynamically
function handleSubscribe(ws, symbols) {
    if (!Array.isArray(symbols)) {
        symbols = [symbols];
    }

    const subscriptions = clients.get(ws);
    const validSymbols = symbols.map(symbol => symbol.toUpperCase());

    validSymbols.forEach(symbol => {
        // Add symbol to mockStocks if it doesn't exist
        if (!mockStocks[symbol]) {
            mockStocks[symbol] = {
                price: 100 + Math.random() * 900, // Random initial price between 100 and 1000
                volume: Math.floor(100000 + Math.random() * 900000) // Random initial volume
            };
            logToFile(`Created new symbol ${symbol} with initial price ${mockStocks[symbol].price}`);
        }
        subscriptions.add(symbol);
    });

    ws.send(JSON.stringify({
        event: 'subscribed',
        symbols: validSymbols,
        message: `Subscribed to ${validSymbols.join(', ')}`
    }));
}

function handleUnsubscribe(ws, symbols) {
    if (!Array.isArray(symbols)) {
        symbols = [symbols];
    }

    const subscriptions = clients.get(ws);
    symbols.forEach(symbol => subscriptions.delete(symbol.toUpperCase()));

    ws.send(JSON.stringify({
        event: 'unsubscribed',
        symbols: symbols,
        message: `Unsubscribed from ${symbols.join(', ')}`
    }));
}

// Modify updatePrices to handle any symbol
function updatePrices() {
    for (let symbol in mockStocks) {
        // Random price movement between -1% and +1%
        const oldPrice = mockStocks[symbol].price;
        const priceChange = oldPrice * (Math.random() * 0.02 - 0.01);
        mockStocks[symbol].price += priceChange;
        mockStocks[symbol].price = Number(mockStocks[symbol].price.toFixed(2));
        
        // Random volume change between -20% and +40%
        mockStocks[symbol].volume = Math.floor(mockStocks[symbol].volume * (0.8 + Math.random() * 0.4));

        // Broadcast to subscribed clients
        const update = {
            event: 'price_update',
            symbol,
            data: {
                price: mockStocks[symbol].price,
                volume: mockStocks[symbol].volume,
                timestamp: new Date().toISOString()
            }
        };

        clients.forEach((subscriptions, client) => {
            if (client.readyState === 1 && subscriptions.has(symbol)) {
                client.send(JSON.stringify(update));
            }
        });
    }
}

// Update prices every 5 seconds
setInterval(updatePrices, 5000);

// Middleware to simulate API latency
app.use((req, res, next) => {
    setTimeout(next, Math.random() * 100); // Random delay 0-100ms
});

// Get price for a specific symbol
app.get('/api/price/:symbol', (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    if (mockStocks[symbol]) {
        res.json({
            symbol,
            price: mockStocks[symbol].price,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({ error: 'Symbol not found' });
    }
});

// Get prices for all symbols
app.get('/api/prices', (req, res) => {
    const prices = Object.entries(mockStocks).map(([symbol, data]) => ({
        symbol,
        price: data.price,
        volume: data.volume,
        timestamp: new Date().toISOString()
    }));
    res.json(prices);
});

// Enter trade endpoint
app.post('/api/trade/enter', express.json(), (req, res) => {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity) {
        return res.status(400).json({ error: 'Symbol and quantity are required' });
    }

    if (!mockStocks[symbol.toUpperCase()]) {
        return res.status(404).json({ error: 'Symbol not found' });
    }

    const tradeId = generateTradeId();
    const entryPrice = mockStocks[symbol.toUpperCase()].price;
    
    activeTrades[tradeId] = {
        symbol: symbol.toUpperCase(),
        quantity,
        entryPrice,
        entryTime: new Date().toISOString(),
        currentPrice: entryPrice
    };

    res.json({
        tradeId,
        symbol: symbol.toUpperCase(),
        quantity,
        entryPrice,
        entryTime: activeTrades[tradeId].entryTime
    });
});

// Exit trade endpoint
app.post('/api/trade/exit/:tradeId', (req, res) => {
    const { tradeId } = req.params;
    
    if (!activeTrades[tradeId]) {
        return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = activeTrades[tradeId];
    const exitPrice = mockStocks[trade.symbol].price;
    const pnl = (exitPrice - trade.entryPrice) * trade.quantity;

    const completedTrade = {
        ...trade,
        exitPrice,
        exitTime: new Date().toISOString(),
        pnl: Number(pnl.toFixed(2))
    };

    // Remove from active trades
    delete activeTrades[tradeId];

    res.json(completedTrade);
});

// Get active trade status
app.get('/api/trade/:tradeId', (req, res) => {
    const { tradeId } = req.params;
    
    if (!activeTrades[tradeId]) {
        return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = activeTrades[tradeId];
    trade.currentPrice = mockStocks[trade.symbol].price;
    trade.unrealizedPnl = Number((trade.currentPrice - trade.entryPrice) * trade.quantity).toFixed(2);

    res.json(trade);
});

// Get all active trades
app.get('/api/trades', (req, res) => {
    const trades = Object.entries(activeTrades).map(([tradeId, trade]) => ({
        tradeId,
        ...trade,
        currentPrice: mockStocks[trade.symbol].price,
        unrealizedPnl: Number((mockStocks[trade.symbol].price - trade.entryPrice) * trade.quantity).toFixed(2)
    }));
    
    res.json(trades);
});

// Validate symbol endpoint
app.get('/api/validate/:symbol', (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    res.json({
        symbol,
        valid: symbol in mockStocks,
        details: mockStocks[symbol] ? {
            currentPrice: mockStocks[symbol].price,
            volume: mockStocks[symbol].volume
        } : null
    });
});

// Validate multiple symbols
app.post('/api/validate', express.json(), (req, res) => {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: 'Please provide an array of symbols' });
    }

    const results = symbols.map(symbol => {
        const upperSymbol = symbol.toUpperCase();
        return {
            symbol: upperSymbol,
            valid: upperSymbol in mockStocks,
            details: mockStocks[upperSymbol] ? {
                currentPrice: mockStocks[upperSymbol].price,
                volume: mockStocks[upperSymbol].volume
            } : null
        };
    });

    res.json(results);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
    // Initialize client's subscriptions
    clients.set(ws, new Set());

    logToFile('Client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            logToFile(`Received message: ${JSON.stringify(data, null, 2)}`);
            
            switch (data.action) {
                case 'subscribe':
                    if (!data.symbols) {
                        logToFile('No symbols in subscribe request');
                        return;
                    }
                    handleSubscribe(ws, data.symbols);
                    break;
                case 'unsubscribe':
                    handleUnsubscribe(ws, data.symbols);
                    break;
                default:
                    logToFile(`Unknown action: ${data.action}`);
                    ws.send(JSON.stringify({ error: 'Unknown action' }));
            }
        } catch (err) {
            logToFile(`Error processing message: ${err.message}`);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        logToFile('Client disconnected');
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ event: 'connected', message: 'Connected to market data stream' }));
});

// Update server.listen instead of app.listen
server.listen(port, () => {
    console.log(`Mock market server running on port ${port}`);
});
