const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastExecuted: Date,
    lastResult: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Strategy', strategySchema); 