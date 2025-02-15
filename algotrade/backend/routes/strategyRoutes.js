const express = require('express');
const strategyController = require('../controllers/strategyController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/strategies/:id/stop', auth, strategyController.stopStrategy);
router.post('/strategies/:id/resume', auth, strategyController.resumeStrategy);
router.post('/strategies/:id/start', auth, strategyController.startStrategy);

module.exports = router; 