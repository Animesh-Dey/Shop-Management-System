const asyncHandler = require('../utils/asyncHandler');
const Sale = require('../models/Sale');
const StockPurchase = require('../models/StockPurchase');
const Product = require('../models/Product');
const { Parser } = require('json2csv');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

const getRange = (type, startDate, endDate) => {
  const now = new Date();
  if (type === 'daily') return { start: startOfDay(now), end: endOfDay(now) };
  if (type === 'weekly') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (type === 'monthly') return { start: startOfMonth(now), end: endOfMonth(now) };
  if (type === 'custom' && startDate && endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start: new Date(startDate), end };
  }
  return { start: startOfMonth(now), end: endOfMonth(now) };
};

const salesReport = asyncHandler(async (req, res) => {
  const { type = 'daily', startDate, endDate, format } = req.query;
  const { start, end } = getRange(type, startDate, endDate);
  const ownerId = req.user._id;
  const match = { ownerId, saleDate: { $gte: start, $lte: end } };

  const [agg, bills] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalBills: { $sum: 1 }, totalDiscount: { $sum: '$discount' } } },
    ]),
    Sale.find(match).sort({ saleDate: -1 }),
  ]);

  const data = {
    range: { start, end, type },
    totalRevenue: agg[0]?.totalRevenue || 0,
    totalBills: agg[0]?.totalBills || 0,
    totalDiscount: agg[0]?.totalDiscount || 0,
    sales: bills,
  };

  if (format === 'csv') {
    const rows = bills.map((s) => ({
      invoiceNumber: s.invoiceNumber,
      date: s.saleDate.toISOString(),
      customerName: s.customerName || '',
      subtotal: s.subtotal,
      discount: s.discount,
      grandTotal: s.grandTotal,
      items: s.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
    }));
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment(`sales-report-${type}.csv`);
    return res.send(csv);
  }

  res.json({ success: true, data });
});

const profitReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, type = 'monthly' } = req.query;
  const { start, end } = getRange(type, startDate, endDate);
  const ownerId = req.user._id;
  const match = { ownerId, saleDate: { $gte: start, $lte: end } };

  const [salesAgg, purchaseAgg] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$items.itemTotal' },
          cost: { $sum: { $multiply: ['$items.quantity', '$items.purchasePriceSnapshot'] } },
          bills: { $addToSet: '$_id' },
        },
      },
      { $project: { revenue: 1, cost: 1, totalBills: { $size: '$bills' } } },
    ]),
    StockPurchase.aggregate([
      { $match: { ownerId, purchaseDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, totalPurchaseCost: { $sum: '$grandTotal' } } },
    ]),
  ]);

  const revenue = salesAgg[0]?.revenue || 0;
  const costOfGoodsSold = salesAgg[0]?.cost || 0;
  res.json({
    success: true,
    data: {
      range: { start, end },
      totalSalesRevenue: revenue,
      totalStockPurchaseCost: purchaseAgg[0]?.totalPurchaseCost || 0,
      estimatedGrossProfit: revenue - costOfGoodsSold,
      totalBills: salesAgg[0]?.totalBills || 0,
    },
  });
});

const topProductsReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  const ownerId = req.user._id;
  const match = { ownerId };
  if (startDate && endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    match.saleDate = { $gte: new Date(startDate), $lte: end };
  }
  const data = await Sale.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.productName' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.itemTotal' },
        cost: { $sum: { $multiply: ['$items.quantity', '$items.purchasePriceSnapshot'] } },
      },
    },
    { $addFields: { profit: { $subtract: ['$revenue', '$cost'] } } },
    { $sort: { quantitySold: -1 } },
    { $limit: Number(limit) },
  ]);
  res.json({ success: true, data });
});

const purchasesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format } = req.query;
  const ownerId = req.user._id;
  const match = { ownerId };
  if (startDate && endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    match.purchaseDate = { $gte: new Date(startDate), $lte: end };
  }
  const purchases = await StockPurchase.find(match).sort({ purchaseDate: -1 });
  if (format === 'csv') {
    const rows = purchases.map((p) => ({
      purchaseNumber: p.purchaseNumber,
      date: p.purchaseDate.toISOString(),
      supplierName: p.supplierName || '',
      grandTotal: p.grandTotal,
      items: p.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
    }));
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('purchases-report.csv');
    return res.send(csv);
  }
  res.json({ success: true, data: purchases });
});

module.exports = { salesReport, profitReport, topProductsReport, purchasesReport };
