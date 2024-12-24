const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parameters: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    entryConditions: [{
        type: String,
        required: true
    }],
    exitConditions: [{
        type: String,
        required: true
    }],
    instruments: [{
        type: String,
        required: true
    }],
    timeframe: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Strategy', strategySchema); 