const mongoose = require('mongoose');

const deployedStrategySchema = new mongoose.Schema({
    strategyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strategy',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    instrument: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: ['paper', 'live'],
        default: 'paper'
    },
    broker: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Running', 'Paused', 'Stopped'],
        default: 'Running'
    },
    pnl: {
        type: Number,
        default: 0
    },
    config: {
        squareOffTime: String,
        qtyMultiplier: {
            type: Number,
            default: 1
        },
        maxLoss: Number,
        maxProfit: Number
    },
    deployedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DeployedStrategy', deployedStrategySchema); 