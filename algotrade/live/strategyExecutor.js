const strategyLogger = require('winston').createLogger({
    level: 'info',
    format: require('winston').format.combine(
        require('winston').format.timestamp(),
        require('winston').format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new (require('winston').transports.File)({ 
            filename: require('path').join(__dirname, 'strategy.log'),
            options: { flags: 'a' }
        })
    ]
});

const { param } = require('../backend/routes/strategy');
const Strategy = require('./models/Strategy');

function createStrategyContext(symbol, price, timestamp) {
    return {
        symbol,
        price,
        timestamp,
        getHistoricalData: async () => {
            return [];
        }
    };
}


async function entryStrategy(params) {
    // Check if start time is provided and current time is before start time
    if (params.startTime) {
        const currentTime = new Date();
        const startTime = new Date(params.startTime);
        
        if (currentTime < startTime) {
            console.log('Start time not yet reached. Skipping entry.');
            return Promise.resolve('Entry skipped due to start time not reached');
        }
    }

    return Promise.resolve({
        result: "ORDER",
        orderPrice : params.price
    })
    
    console.log('Entry strategy for symbol:', params.symbol);
    console.log('Entry Price:', params.entryPrice);
    console.log('Entry Quantity:', params.entryQuantity);
    return Promise.resolve('Entry strategy executed');
}

async function processingStrategy(params) {
    // Calculate profit
    let profit = 0;
    if (params.entryPrice && params.entryQuantity && params.price) {
        profit = (params.price - params.entryPrice) * params.entryQuantity;
    }

    // Calculate loss limit based on stopLoss if provided
    let lossLimit = 0;
    if (params.stopLoss && params.entryPrice) {
        lossLimit = Math.abs(params.entryPrice - params.stopLoss) * (params.entryQuantity || 1);
    }


   
    if(params.onStoplossProfit && params.trailBy){

        // Initialize trailingProfit if not set
        if(!params.trailingProfit) {
            params.trailingProfit = params.entryPrice || params.price;
        }
        
        let trailingProfit = params.price - params.trailingProfit;

        if(trailingProfit >= params.onStoplossProfit){
            let n = Math.floor(trailingProfit / params.onStoplossProfit);
            let oldStopLoss = params.stopLoss || params.entryPrice;
            params.stopLoss = (params.stopLoss || params.entryPrice) + params.trailBy * n;
            
            console.log('Profit increased by:', trailingProfit, 'updating stoploss by:', params.trailBy * n);
            console.log('Previous stop loss:', oldStopLoss);
            console.log('Updated stop loss:', params.stopLoss);
            
            params.trailingProfit = params.price;
        }
    }
    
    return Promise.resolve('Processing strategy executed');
}

async function exitStrategy(params) {
    let profit = 0;
    if (params.entryPrice && params.entryQuantity && params.price) {
        profit = (params.price - params.entryPrice) * params.entryQuantity;
    }
    
    // Check if profit exceeds the profit limit
    if (profit >= params.profitLimit) {
        console.log('Profit limit reached. Exiting position.');
        return Promise.resolve('Profit limit reached. Position closed.');
    }
    
    // Check if loss exceeds the calculated loss limit
    if (params.calculatedLossLimit && profit <= -params.calculatedLossLimit) {
        console.log('Loss limit reached. Exiting position.');
        return Promise.resolve('Loss limit reached. Position closed.');
    }
    
    // Check trailing stop loss exit condition
    if (params.trailingStopPrice && params.price <= params.trailingStopPrice) {
        console.log('Trailing stop loss triggered. Exiting position.');
        return Promise.resolve('Trailing stop loss triggered. Position closed.');
    }
    
    // Check if stop time is provided and current time is after stop time
    if (params.stopTime) {
        const currentTime = new Date();
        const stopTime = new Date(params.stopTime);
        
        if (currentTime >= stopTime) {
            console.log('Stop time reached. Exiting position.');
            return Promise.resolve('Stop time reached. Position closed.');
        }
    }
    
    console.log('Exit strategy for symbol:', params.symbol);
    return Promise.resolve('No exit strategy executed');
}

async function executeStrategy(params) {
    console.log('Executing strategies for symbol:', params.symbol);
    
    // Call entry strategy
    await entryStrategy(params);
    
    // Call processing strategy
    await processingStrategy(params);
    
    // Call exit strategy
    const exitResult = await exitStrategy(params);
    
    return Promise.resolve('Mock execution complete: ' + exitResult);
}

module.exports = executeStrategy; 