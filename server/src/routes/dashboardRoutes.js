const express = require('express');
const { protect } = require('../middleware/auth');
const { getStats, getSalesChart, getTopProducts } = require('../controllers/dashboardController');

const router = express.Router();
router.use(protect);
router.get('/stats', getStats);
router.get('/sales-chart', getSalesChart);
router.get('/top-products', getTopProducts);

module.exports = router;
