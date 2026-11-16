const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { withOptionalTransaction } = require('../utils/transactions');

const getInventory = asyncHandler(async (req, res) => {
  const { search, category, lowStock, page = 1, limit = 50 } = req.query;
  const query = { ownerId: req.user._id };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = category;
  if (lowStock === 'true') {
    query.$expr = { $lte: ['$stock', '$minimumStock'] };
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);
  res.json({
    success: true,
    data: items,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

const getLowStock = asyncHandler(async (req, res) => {
  const items = await Product.find({
    ownerId: req.user._id,
    $expr: { $lte: ['$stock', '$minimumStock'] },
  }).sort({ stock: 1 });
  res.json({ success: true, data: items });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;
  const qty = Number(quantity);
  if (!productId || !qty || qty === 0) throw new ApiError(400, 'Product and non-zero quantity are required');
  if (!reason) throw new ApiError(400, 'Reason is required');

  const movement = await withOptionalTransaction(async (session) => {
    const q = { _id: productId, ownerId: req.user._id };
    const product = await (session ? Product.findOne(q).session(session) : Product.findOne(q));
    if (!product) throw new ApiError(404, 'Product not found');
    const previousStock = product.stock;
    const updatedStock = Math.round((previousStock + qty + Number.EPSILON) * 100) / 100;
    if (updatedStock < 0) throw new ApiError(400, 'Adjustment would result in negative inventory');
    const opts = session ? { session } : undefined;
    await Product.updateOne({ _id: product._id }, { $set: { stock: updatedStock } }, opts);
    const created = await StockMovement.create(
      [
        {
          ownerId: req.user._id,
          productId: product._id,
          movementType: 'Adjustment',
          quantity: qty,
          previousStock,
          updatedStock,
          referenceId: '',
          reason,
        },
      ],
      session ? { session } : undefined
    );
    return created[0];
  });

  res.status(201).json({ success: true, data: movement });
});

const getMovements = asyncHandler(async (req, res) => {
  const { productId, type, page = 1, limit = 50 } = req.query;
  const query = { ownerId: req.user._id };
  if (productId) query.productId = productId;
  if (type) query.movementType = type;
  const skip = (Number(page) - 1) * Number(limit);
  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .populate('productId', 'name unit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    StockMovement.countDocuments(query),
  ]);
  res.json({
    success: true,
    data: movements,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

module.exports = { getInventory, getLowStock, adjustStock, getMovements };
