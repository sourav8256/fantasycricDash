const Strategy = require('../models/Strategy');
const DeployedStrategy = require('../models/DeployedStrategy');
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
            // userId: userId
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
            maxProfit,
            instrument
        } = req.body;

        // Validate required fields
        if (!broker) {
            return res.status(400).json({ message: 'Broker is required' });
        }

        // Create deployed strategy object
        const deployedStrategy = new DeployedStrategy({
            strategyId: strategyId,
            userId: userId,
            name: strategy.name,
            instrument: instrument,
            mode: mode,
            broker: broker,
            status: 'Running',
            pnl: 0,
            config: {
                squareOffTime,
                qtyMultiplier,
                maxLoss,
                maxProfit
            }
        });

        // Save to database
        await deployedStrategy.save();

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
        const userDeployedStrategies = await DeployedStrategy.find({});
        
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

// Stop a deployed strategy
const stopStrategy = async (req, res) => {
    try {
        const strategyId = req.params.id;
        const userId = req.user.id;

        // Find the deployed strategy
        const deployedStrategy = await DeployedStrategy.findOne({
            strategyId: strategyId,
            userId: userId
        });

        if (!deployedStrategy) {
            return res.status(404).json({ message: 'Deployed strategy not found' });
        }

        // Update status to Paused
        deployedStrategy.status = 'Paused';
        await deployedStrategy.save();

        // In a real implementation, you would:
        // 1. Stop strategy execution
        // 2. Clean up any active orders/positions
        // 3. Update monitoring

        res.json({ 
            message: 'Strategy stopped successfully',
            strategy: deployedStrategy 
        });

    } catch (error) {
        console.error('Error stopping strategy:', error);
        res.status(500).json({ 
            message: 'Failed to stop strategy',
            error: error.message 
        });
    }
};

// Resume a deployed strategy
const resumeStrategy = async (req, res) => {
    try {
        const strategyId = req.params.id;
        const userId = req.user.id;

        // Find the deployed strategy
        const deployedStrategy = await DeployedStrategy.findOne({
            strategyId: strategyId,
            userId: userId
        });

        if (!deployedStrategy) {
            return res.status(404).json({ message: 'Deployed strategy not found' });
        }

        // Update status to Running
        deployedStrategy.status = 'Running';
        await deployedStrategy.save();

        // In a real implementation, you would:
        // 1. Restart strategy execution
        // 2. Reinitialize monitoring
        // 3. Check market conditions before resuming

        res.json({ 
            message: 'Strategy resumed successfully',
            strategy: deployedStrategy 
        });

    } catch (error) {
        console.error('Error resuming strategy:', error);
        res.status(500).json({ 
            message: 'Failed to resume strategy',
            error: error.message 
        });
    }
};

// Start a deployed strategy
const startStrategy = async (req, res) => {
    try {
        const strategyId = req.params.id;
        const userId = req.user.id;

        // Find the deployed strategy
        const deployedStrategy = await DeployedStrategy.findOne({
            strategyId: strategyId,
            userId: userId
        });

        if (!deployedStrategy) {
            return res.status(404).json({ message: 'Deployed strategy not found' });
        }

        // Update status to Running
        deployedStrategy.status = 'Running';
        await deployedStrategy.save();

        // In a real implementation, you would:
        // 1. Initialize strategy execution
        // 2. Set up monitoring
        // 3. Validate market conditions
        // 4. Place initial orders if needed

        res.json({ 
            message: 'Strategy started successfully',
            strategy: deployedStrategy 
        });

    } catch (error) {
        console.error('Error starting strategy:', error);
        res.status(500).json({ 
            message: 'Failed to start strategy',
            error: error.message 
        });
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
    deployStrategy,
    stopStrategy,
    resumeStrategy,
    startStrategy
}; 