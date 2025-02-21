const mongoose = require('mongoose');
const legSchema = require('./schemas/LegSchema');
const riskManagementSchema = require('./schemas/RiskManagementSchema');
const deploymentSchema = require('./schemas/DeploymentSchema');

const strategySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['time', 'indicator'],
        default: 'time'
    },
    instrument: {
        type: String,
        enum: ['BANKNIFTY', 'NIFTY', 'FINNIFTY'],
        required: true
    },
    legs: [legSchema],
    riskManagement: {
        type: riskManagementSchema,
        default: () => ({})
    },
    deployment: {
        type: deploymentSchema,
        default: () => ({})
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