const express = require('express');
const { protect } = require('../middleware/auth');
const { salesReport, profitReport, topProductsReport, purchasesReport } = require('../controllers/reportController');

const router = express.Router();
router.use(protect);
router.get('/sales', salesReport);
router.get('/profit', profitReport);
router.get('/top-products', topProductsReport);
router.get('/purchases', purchasesReport);

module.exports = router;
