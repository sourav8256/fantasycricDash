const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
    getAvailableStrategies,
    getDeployedStrategies,
    getStrategyById,
    createStrategy,
    updateStrategy,
    deleteStrategy
} = require('../controllers/strategyController');

// Public route for available strategies
router.get('/available', getAvailableStrategies);

// Protected routes
router.use(authenticateToken);
router.get('/deployed', getDeployedStrategies);
router.get('/:id', getStrategyById);
router.post('/', createStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);

module.exports = router; 