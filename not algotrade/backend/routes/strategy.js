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
    deployStrategy,
    stopStrategy,
    resumeStrategy,
    startStrategy,
    deleteDeployedStrategy,
    getDeployedStrategiesHtml,
    errorHandler,
    testStrategy
} = require('../controllers/strategyController');

// Move the HTML route before authentication middleware
router.get('/deployed/html', getDeployedStrategiesHtml);

// All other routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get('/available', getAvailableStrategies);
router.get('/deployed', getDeployedStrategies);
router.get('/:id', getStrategyById);
router.post('/', createStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);
router.post('/:id/deploy', deployStrategy);

// Strategy execution operations
router.post('/:id/stop', stopStrategy);
router.post('/:id/resume', resumeStrategy);
router.post('/:id/start', startStrategy);

// Add new route for deleting deployed strategies
router.delete('/deployed/:id', deleteDeployedStrategy);

// Add this new route before the error handler
router.post('/:id/test-strategy', testStrategy);

// Add error handler as the last middleware
router.use(errorHandler);

module.exports = router; 