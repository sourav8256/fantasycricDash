const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
    squareOffTime: {
        type: String,
        default: '15:15'
    },
    qtyMultiplier: {
        type: String,
        default: '1'
    },
    maxLoss: {
        type: String,
        default: ''
    },
    maxProfit: {
        type: String,
        default: ''
    }
});

module.exports = deploymentSchema; 