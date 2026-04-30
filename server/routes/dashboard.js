const express = require('express');
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');

const router = express.Router();
router.use(auth);
router.get('/stats', getStats);

module.exports = router;
