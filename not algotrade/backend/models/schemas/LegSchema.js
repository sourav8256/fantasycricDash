const mongoose = require('mongoose');

const legSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Buy', 'Sell'],
        required: true
    },
    strike: {
        type: String,
        enum: ['ATM', 'ITM', 'OTM'],
        required: true
    },
    option: {
        type: String,
        enum: ['CE', 'PE'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

module.exports = legSchema; 