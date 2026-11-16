const express = require('express');
const { protect } = require('../middleware/auth');
const { createSale, getSales, getSale } = require('../controllers/saleController');

const router = express.Router();
router.use(protect);
router.route('/').get(getSales).post(createSale);
router.route('/:id').get(getSale);

module.exports = router;
