const express = require('express');
const { protect } = require('../middleware/auth');
const { createPurchase, getPurchases, getPurchase } = require('../controllers/purchaseController');

const router = express.Router();
router.use(protect);
router.route('/').get(getPurchases).post(createPurchase);
router.route('/:id').get(getPurchase);

module.exports = router;
