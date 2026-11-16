const asyncHandler = require('../utils/asyncHandler');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } = require('date-fns');

const getStats = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [todayAgg, monthAgg, totalProducts, lowStockCount, inventoryAgg] = await Promise.all([
    Sale.aggregate([
      { $match: { ownerId, saleDate: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, bills: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { ownerId, saleDate: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, totalSales: { $sum: '$grandTotal' } } },
    ]),
    Product.countDocuments({ ownerId }),
    Product.countDocuments({ ownerId, $expr: { $lte: ['$stock', '$minimumStock'] } }),
    Product.aggregate([
      { $match: { ownerId } },
      { $group: { _id: null, value: { $sum: { $multiply: ['$stock', '$purchasePrice'] } } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      todaySales: todayAgg[0]?.totalSales || 0,
      todayBills: todayAgg[0]?.bills || 0,
      totalProducts,
      lowStockCount,
      inventoryValue: inventoryAgg[0]?.value || 0,
      monthSales: monthAgg[0]?.totalSales || 0,
    },
  });
});

const getSalesChart = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(new Date(), 6));
  const agg = await Sale.aggregate([
    { $match: { ownerId, saleDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        total: { $sum: '$grandTotal' },
        bills: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const map = new Map(agg.map((a) => [a._id, a]));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = d.toISOString().slice(0, 10);
    const found = map.get(key);
    days.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      total: found?.total || 0,
      bills: found?.bills || 0,
    });
  }
  res.json({ success: true, data: days });
});

const getTopProducts = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const top = await Sale.aggregate([
    { $match: { ownerId } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.productName' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.itemTotal' },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);
  res.json({ success: true, data: top });
});

module.exports = { getStats, getSalesChart, getTopProducts };
