const Strategy = require('../models/Strategy');
const DeployedStrategy = require('../models/DeployedStrategy');
const executeStrategies = require('../../live/strategyExecutor');

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
        const userDeployedStrategies = await DeployedStrategy.find({})
            .populate('strategyId');
        
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
        const {
            name,
            type = 'time',
            instrument,
            legs = [],
            riskManagement = {},
            deployment = {}
        } = req.body;

        // Validate required fields
        if (!name || !instrument) {
            return res.status(400).json({ 
                message: 'Name and instrument are required fields' 
            });
        }

        // Create strategy with all fields
        const strategy = new Strategy({
            name,
            type,
            instrument,
            legs,
            riskManagement,
            deployment,
            userId: req.user.id
        });

        const savedStrategy = await strategy.save();
        res.status(201).json(savedStrategy);
    } catch (err) {
        console.error('Error creating strategy:', err);
        res.status(400).json({ 
            message: err.message,
            details: err.errors // Include validation errors if any
        });
    }
};

const updateStrategy = async (req, res) => {
    try {
        const {
            name,
            type,
            instrument,
            legs,
            riskManagement,
            deployment
        } = req.body;

        const strategy = await Strategy.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({ message: 'Strategy not found' });
        }

        // Update all fields
        if (name) strategy.name = name;
        if (type) strategy.type = type;
        if (instrument) strategy.instrument = instrument;
        if (legs) strategy.legs = legs;
        if (riskManagement) strategy.riskManagement = riskManagement;
        if (deployment) strategy.deployment = deployment;

        const updatedStrategy = await strategy.save();
        res.json(updatedStrategy);
    } catch (err) {
        console.error('Error updating strategy:', err);
        res.status(400).json({ 
            message: err.message,
            details: err.errors
        });
    }
};

const deleteStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findOneAndDelete({
            _id: req.params.id
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

        // Add graceful shutdown steps
        try {
            // 1. Set status to "Stopping" first
            deployedStrategy.status = 'Stopping';
            await deployedStrategy.save();

            // 2. Clean up any active connections or processes
            await cleanupStrategyConnections(deployedStrategy);

            // 3. Update final status to Paused
            deployedStrategy.status = 'Paused';
            await deployedStrategy.save();

        } catch (cleanupError) {
            console.error('Error during strategy cleanup:', cleanupError);
            // Even if cleanup fails, we want to mark it as stopped
            deployedStrategy.status = 'Error';
            await deployedStrategy.save();
            
            return res.status(500).json({
                message: 'Strategy stopped with errors',
                error: cleanupError.message
            });
        }

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

// Add helper function for cleanup
const cleanupStrategyConnections = async (deployedStrategy) => {
    return new Promise((resolve, reject) => {
        try {
            // Add timeout to ensure the function eventually resolves
            const timeout = setTimeout(() => {
                resolve();
            }, 5000); // 5 second timeout

            // Perform cleanup steps:
            // 1. Close any open orders
            // 2. Close websocket connections
            // 3. Cancel any pending operations

            // Clear timeout if cleanup finishes before timeout
            clearTimeout(timeout);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
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

// Add this new function
const deleteDeployedStrategy = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // First find the deployed strategy
        const deployedStrategy = await DeployedStrategy.findOne({
            _id: id
        });

        if (!deployedStrategy) {
            return res.status(404).json({ message: 'Deployed strategy not found' });
        }

        // Delete the deployed strategy
        await DeployedStrategy.findByIdAndDelete(id);

        // Also delete the base strategy if it exists
        if (deployedStrategy.strategyId) {
            await Strategy.findByIdAndDelete(deployedStrategy.strategyId);
        }

        res.json({ 
            message: 'Deployed strategy deleted successfully',
            deletedStrategy: deployedStrategy
        });

    } catch (error) {
        console.error('Error deleting deployed strategy:', error);
        res.status(500).json({ 
            message: 'Failed to delete deployed strategy',
            error: error.message 
        });
    }
};

const getDeployedStrategiesHtml = async (req, res) => {
    try {
        const deployedStrategies = await DeployedStrategy.find({})
            .populate({
                path: 'strategyId',
                select: '-__v'  // Include all fields except __v
            })
            .populate({
                path: 'userId',
                select: 'username email'  // Include username and email
            });

        res.json(deployedStrategies);
    } catch (err) {
        console.error('Error getting deployed strategies:', err);
        res.status(500).json({ error: err.message });
    }
};

// Add error handling middleware
const errorHandler = (error, req, res, next) => {
    console.error('Strategy Controller Error:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: error.message
    });
};

// Add this new controller function
const testStrategy = async (req, res) => {
    try {
        const { currentPrice, strategyName } = req.body;
        const strategyId = req.params.id;

        // Get the strategy
        const strategy = await Strategy.findById(strategyId);
        if (!strategy) {
            return res.status(404).json({ message: 'Strategy not found' });
        }

        // Execute the strategy using the executor
        const result = await executeStrategies(
            strategy.instrument, 
            currentPrice,
            new Date(),
            [strategy]
        );

        res.json(result);

    } catch (error) {
        console.error('Error testing strategy:', error);
        res.status(500).json({ 
            message: 'Error testing strategy',
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
    startStrategy,
    deleteDeployedStrategy,
    getDeployedStrategiesHtml,
    errorHandler,
    testStrategy,
}; 