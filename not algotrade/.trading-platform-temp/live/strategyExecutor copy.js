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

async function executeStrategy(strategy, context) {
    try {
        strategyLogger.info(`Executing strategy ${strategy.name} for ${context.symbol} at price ${context.price}`);
        
        const strategyFunction = new Function('context', strategy.code);
        const result = await strategyFunction(context);

        let action = null;
        if (result && typeof result === 'object') {
            if (result.signal === 'buy') {
                action = 'buy';
            } else if (result.signal === 'sell') {
                action = 'sell';
            }
        }

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

        const legs = strategy.legs || [];
        for (const leg of legs) {
            console.log(`Processing leg: ${JSON.stringify(leg)}`);
        }

        const { qtyMultiplier = 1 } = strategy.deployment || {};
        console.log(`Executing with quantity multiplier: ${qtyMultiplier}`);

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

async function executeStrategies(symbol, price, timestamp, loadedStrategies) {
    try {
        strategyLogger.info(`Executing strategies for symbol: ${symbol}`);
        
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

module.exports = executeStrategies; 