const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockPurchase = require('../models/StockPurchase');

const getProducts = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 50, all } = req.query;
  const query = { ownerId: req.user._id };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = category;

  if (all === 'true') {
    const products = await Product.find(query).sort({ name: 1 });
    return res.json({ success: true, data: products });
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);
  res.json({
    success: true,
    data: products,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, barcode, sku, category, purchasePrice, sellingPrice, stock, minimumStock, unit } = req.body;
  if (!name || !category || purchasePrice == null || sellingPrice == null || unit == null) {
    throw new ApiError(400, 'Missing required fields');
  }
  const product = await Product.create({
    ownerId: req.user._id,
    name,
    barcode: barcode || '',
    sku: sku || '',
    category,
    purchasePrice: Number(purchasePrice),
    sellingPrice: Number(sellingPrice),
    stock: Number(stock || 0),
    minimumStock: Number(minimumStock || 0),
    unit,
  });
  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!product) throw new ApiError(404, 'Product not found');
  const fields = ['name', 'barcode', 'sku', 'category', 'purchasePrice', 'sellingPrice', 'minimumStock', 'unit'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  // stock should not be edited directly here except maybe not allowed; spec says "manual stock adjustments" separate.
  // but allow stock if provided? better to ignore to force adjustments/inventory flows; however edit existing products is general.
  await product.save();
  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!product) throw new ApiError(404, 'Product not found');
  const [saleRef, purchaseRef] = await Promise.all([
    Sale.findOne({ ownerId: req.user._id, 'items.productId': product._id }),
    StockPurchase.findOne({ ownerId: req.user._id, 'items.productId': product._id }),
  ]);
  if (saleRef || purchaseRef) {
    throw new ApiError(400, 'Cannot delete product referenced by historical sales or purchases');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
