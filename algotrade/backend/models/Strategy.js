const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Time Based', 'Indicator Based']
    },
    instrument: {
        type: String,
        required: true,
        enum: ['NIFTY', 'BANKNIFTY', 'FINNIFTY']
    },
    legs: {
        type: String,
        required: true
    },
    target: {
        type: Number,
        required: true
    },
    stopLoss: {
        type: Number,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Strategy', strategySchema); 