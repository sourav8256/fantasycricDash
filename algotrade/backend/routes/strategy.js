const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
    getStrategies,
    createStrategy,
    updateStrategy,
    deleteStrategy
} = require('../controllers/strategyController');

router.use(authenticateToken);

router.get('/', getStrategies);
router.post('/', createStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);

module.exports = router; 