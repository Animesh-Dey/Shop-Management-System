const express = require('express');
const { protect } = require('../middleware/auth');
const { getInventory, getLowStock, adjustStock, getMovements } = require('../controllers/inventoryController');

const router = express.Router();
router.use(protect);
router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.post('/adjustment', adjustStock);
router.get('/movements', getMovements);

module.exports = router;
