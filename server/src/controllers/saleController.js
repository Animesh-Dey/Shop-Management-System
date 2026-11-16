const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { getNextSequence } = require('../utils/counters');
const { withOptionalTransaction } = require('../utils/transactions');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// simple in-memory idempotency cache per process (best-effort)
const recentKeys = new Map();
const rememberKey = (key, resultId) => {
  if (!key) return;
  recentKeys.set(key, { resultId, ts: Date.now() });
  if (recentKeys.size > 500) {
    for (const [k, v] of recentKeys) {
      if (Date.now() - v.ts > 10 * 60 * 1000) recentKeys.delete(k);
    }
  }
};

const createSale = asyncHandler(async (req, res) => {
  const { items, discount = 0, customerName = '', customerPhone = '', idempotencyKey } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Sale items are required');
  }
  if (discount < 0) throw new ApiError(400, 'Discount cannot be negative');

  if (idempotencyKey && recentKeys.has(idempotencyKey)) {
    const cached = recentKeys.get(idempotencyKey);
    const existing = await Sale.findOne({ _id: cached.resultId, ownerId: req.user._id });
    if (existing) return res.status(201).json({ success: true, data: existing, duplicate: true });
  }

  const sale = await withOptionalTransaction(async (session) => {
    // Aggregate quantities per product to validate total
    const qtyMap = new Map();
    for (const it of items) {
      if (!it.productId || !it.quantity || Number(it.quantity) <= 0) {
        throw new ApiError(400, 'Invalid item quantity');
      }
      const q = Number(it.quantity);
      qtyMap.set(it.productId, (qtyMap.get(it.productId) || 0) + q);
    }

    const productIds = [...qtyMap.keys()];
    const q = { _id: { $in: productIds }, ownerId: req.user._id };
    const products = await (session ? Product.find(q).session(session) : Product.find(q));
    if (products.length !== productIds.length) {
      throw new ApiError(400, 'One or more products not found');
    }
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    for (const [pid, qty] of qtyMap.entries()) {
      const p = productMap.get(String(pid));
      if (p.stock < qty) {
        throw new ApiError(400, `Insufficient stock for ${p.name}`);
      }
    }

    let subtotal = 0;
    const saleItems = [];
    for (const it of items) {
      const p = productMap.get(String(it.productId));
      const quantity = Number(it.quantity);
      const itemTotal = round2(p.sellingPrice * quantity);
      subtotal = round2(subtotal + itemTotal);
      saleItems.push({
        productId: p._id,
        productName: p.name,
        quantity,
        unit: p.unit,
        sellingPrice: p.sellingPrice,
        purchasePriceSnapshot: p.purchasePrice,
        itemTotal,
      });
    }

    const disc = round2(discount);
    if (disc > subtotal) throw new ApiError(400, 'Discount cannot exceed subtotal');
    const grandTotal = round2(subtotal - disc);

    const invoiceNumber = await getNextSequence(req.user._id, 'invoice', 'INV', session);

    const created = await Sale.create(
      [
        {
          ownerId: req.user._id,
          invoiceNumber,
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          items: saleItems,
          subtotal,
          discount: disc,
          grandTotal,
          saleDate: new Date(),
        },
      ],
      session ? { session } : undefined
    );
    const saleDoc = created[0];

    // Deduct stock and record movements
    for (const [pid, qty] of qtyMap.entries()) {
      const p = productMap.get(String(pid));
      const previousStock = p.stock;
      const updatedStock = round2(previousStock - qty);
      if (updatedStock < 0) throw new ApiError(400, `Insufficient stock for ${p.name}`);
      const updateOpts = session ? { session } : undefined;
      await Product.updateOne({ _id: p._id }, { $inc: { stock: -qty } }, updateOpts);
      await StockMovement.create(
        [
          {
            ownerId: req.user._id,
            productId: p._id,
            movementType: 'Sale',
            quantity: -qty,
            previousStock,
            updatedStock,
            referenceId: saleDoc.invoiceNumber,
            reason: `Sale ${saleDoc.invoiceNumber}`,
          },
        ],
        session ? { session } : undefined
      );
    }

    return saleDoc;
  });

  rememberKey(idempotencyKey, sale._id);
  res.status(201).json({ success: true, data: sale });
});

const getSales = asyncHandler(async (req, res) => {
  const { search, customer, startDate, endDate, page = 1, limit = 20 } = req.query;
  const query = { ownerId: req.user._id };
  if (search) query.invoiceNumber = { $regex: search, $options: 'i' };
  if (customer) query.customerName = { $regex: customer, $options: 'i' };
  if (startDate || endDate) {
    query.saleDate = {};
    if (startDate) query.saleDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.saleDate.$lte = end;
    }
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [sales, total] = await Promise.all([
    Sale.find(query).sort({ saleDate: -1 }).skip(skip).limit(Number(limit)),
    Sale.countDocuments(query),
  ]);
  res.json({
    success: true,
    data: sales,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

const getSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!sale) throw new ApiError(404, 'Sale not found');
  res.json({ success: true, data: sale });
});

module.exports = { createSale, getSales, getSale };
