const Strategy = require('../models/Strategy');

// Get all available strategies (no authentication required)
const getAvailableStrategies = async (req, res) => {
    try {
        const strategies = [
            {
                id: "double-calendar",
                name: "Double Calendar",
                type: "Time Based",
                instrument: "NIFTY",
                legs: "4 legs",
                target: 5000,
                stopLoss: 2500
            },
            {
                id: "straddle-hedge",
                name: "Straddle with Hedge",
                type: "Time Based",
                instrument: "BANKNIFTY",
                legs: "3 legs",
                target: 8000,
                stopLoss: 4000
            },
            {
                id: "bollinger-reversal",
                name: "Bollinger Band Reversal",
                type: "Indicator Based",
                instrument: "FINNIFTY",
                legs: "2 legs",
                target: 3000,
                stopLoss: 1500
            }
        ];
        
        res.json(strategies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get user's deployed strategies
const getDeployedStrategies = async (req, res) => {
    try {
        const strategies = await Strategy.find({ userId: req.user.id });
        res.json(strategies);
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

module.exports = {
    getAvailableStrategies,
    getDeployedStrategies,
    getStrategyById,
    createStrategy,
    updateStrategy,
    deleteStrategy
}; 