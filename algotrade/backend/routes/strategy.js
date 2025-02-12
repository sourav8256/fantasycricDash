const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
    getAvailableStrategies,
    getDeployedStrategies,
    getStrategyById,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    deployStrategy
} = require('../controllers/strategyController');

// All routes require authentication
router.use(authenticateToken);
router.get('/available', getAvailableStrategies);
router.get('/deployed', getDeployedStrategies);
router.get('/:id', getStrategyById);
router.post('/', createStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);
router.post('/:id/deploy', deployStrategy);

module.exports = router; 