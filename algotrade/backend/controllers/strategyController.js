const Strategy = require('../models/Strategy');

const getStrategies = async (req, res) => {
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
    getStrategies,
    getStrategyById,
    createStrategy,
    updateStrategy,
    deleteStrategy
}; 