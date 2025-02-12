const Strategy = require('../models/Strategy');
// Get all available strategies (no authentication required)
const getAvailableStrategies = async (req, res) => {
    try {
        const strategies = await Strategy.find({});
        res.json(strategies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Sample deployed strategies data (replace with database implementation)
let deployedStrategies = [];

const deployStrategy = async (req, res) => {
    try {
        const strategyId = req.params.id;
        const userId = req.user.id;
        
        // Get the strategy from available strategies
        const strategy = await Strategy.findOne({
            _id: strategyId,
            userId: userId
        });

        if (!strategy) {
            return res.status(404).json({ message: 'Strategy not found' });
        }

        // Get deployment configuration from request body
        const {
            mode = 'paper',  // 'paper' or 'live'
            broker,
            squareOffTime,
            qtyMultiplier = 1,
            maxLoss,
            maxProfit
        } = req.body;

        // Validate required fields
        if (!broker) {
            return res.status(400).json({ message: 'Broker is required' });
        }

        // Create deployed strategy object
        const deployedStrategy = {
            id: `${strategyId}_${Date.now()}`,
            strategyId: strategyId,
            userId: userId,
            name: strategy.name,
            type: strategy.type,
            instrument: strategy.instrument,
            mode: mode,
            broker: broker,
            status: 'Running',
            pnl: 0,
            deployedAt: new Date(),
            config: {
                squareOffTime,
                qtyMultiplier,
                maxLoss,
                maxProfit
            }
        };

        // In a real implementation, you would:
        // 1. Save to database
        // 2. Initialize broker connection
        // 3. Start strategy execution
        // 4. Set up monitoring

        // For now, just add to our in-memory array
        deployedStrategies.push(deployedStrategy);

        res.status(201).json({
            message: 'Strategy deployed successfully',
            deployedStrategy
        });

    } catch (error) {
        console.error('Error deploying strategy:', error);
        res.status(500).json({ 
            message: 'Failed to deploy strategy',
            error: error.message 
        });
    }
};

// Update getDeployedStrategies to return deployed strategies
const getDeployedStrategies = async (req, res) => {
    try {
        // In a real implementation, fetch from database
        const userDeployedStrategies = deployedStrategies.filter(
            strategy => strategy.userId === req.user.id
        );
        
        res.json(userDeployedStrategies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getStrategyById = async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({ message: 'Strategy not found' });
        }

        res.json(strategy);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createStrategy = async (req, res) => {
    try {
        const strategy = new Strategy({
            ...req.body,
            userId: req.user.id
        });
        const savedStrategy = await strategy.save();
        res.status(201).json(savedStrategy);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({ message: 'Strategy not found' });
        }

        Object.assign(strategy, req.body);
        strategy.lastModified = Date.now();
        
        const updatedStrategy = await strategy.save();
        res.json(updatedStrategy);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({ message: 'Strategy not found' });
        }

        res.json({ message: 'Strategy deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Export all functions
module.exports = {
    getAvailableStrategies,
    getDeployedStrategies,
    getStrategyById,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    deployStrategy
}; 