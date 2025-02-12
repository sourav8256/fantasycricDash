const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
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
        required: true
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
    description: {
        type: String,
        required: false
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