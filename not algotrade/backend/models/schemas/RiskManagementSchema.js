const mongoose = require('mongoose');

const riskManagementSchema = new mongoose.Schema({
    profitTarget: {
        type: String,
        default: ''
    },
    stopLoss: {
        type: String,
        default: ''
    },
    noTradeTime: {
        type: String,
        default: ''
    },
    profitManagement: {
        type: String,
        enum: ['noTrailing', 'lockFixProfit', 'totalProfit', 'lockAndTrail'],
        default: 'noTrailing'
    },
    trailStep: {
        type: String,
        default: '400'
    },
    profitStep: {
        type: String,
        default: '800'
    }
});

module.exports = riskManagementSchema; 