const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const StockPurchase = require('../models/StockPurchase');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { getNextSequence } = require('../utils/counters');
const { withOptionalTransaction } = require('../utils/transactions');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const createPurchase = asyncHandler(async (req, res) => {
  const { supplierName = '', items, additionalNotes = '', purchaseDate } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Purchase items are required');

  const purchase = await withOptionalTransaction(async (session) => {
    const productIds = items.map((i) => i.productId);
    const q = { _id: { $in: productIds }, ownerId: req.user._id };
    const products = await (session ? Product.find(q).session(session) : Product.find(q));
    if (products.length !== new Set(productIds.map(String)).size) {
      throw new ApiError(400, 'One or more products not found');
    }
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    let subtotal = 0;
    const purchaseItems = [];
    for (const it of items) {
      const p = productMap.get(String(it.productId));
      if (!p) throw new ApiError(400, 'Product not found');
      const qty = Number(it.quantity);
      const price = Number(it.purchasePrice);
      if (qty <= 0 || price < 0) throw new ApiError(400, 'Invalid quantity or price');
      const itemTotal = round2(qty * price);
      subtotal = round2(subtotal + itemTotal);
      purchaseItems.push({
        productId: p._id,
        productName: p.name,
        quantity: qty,
        purchasePrice: price,
        itemTotal,
      });
    }

    const purchaseNumber = await getNextSequence(req.user._id, 'purchase', 'PUR', session);
    const created = await StockPurchase.create(
      [
        {
          ownerId: req.user._id,
          purchaseNumber,
          supplierName,
          items: purchaseItems,
          subtotal,
          additionalNotes,
          grandTotal: subtotal,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        },
      ],
      session ? { session } : undefined
    );
    const doc = created[0];

    for (const it of purchaseItems) {
      const p = productMap.get(String(it.productId));
      const previousStock = p.stock;
      const updatedStock = round2(previousStock + it.quantity);
      const opts = session ? { session } : undefined;
      await Product.updateOne(
        { _id: p._id },
        { $inc: { stock: it.quantity }, $set: { purchasePrice: it.purchasePrice } },
        opts
      );
      // update local for movement accuracy if same product appears again? we disallow duplicates effectively by set check above maybe not; but ok
      p.stock = updatedStock;
      await StockMovement.create(
        [
          {
            ownerId: req.user._id,
            productId: p._id,
            movementType: 'Purchase',
            quantity: it.quantity,
            previousStock,
            updatedStock,
            referenceId: doc.purchaseNumber,
            reason: `Purchase ${doc.purchaseNumber}`,
          },
        ],
        session ? { session } : undefined
      );
    }
    return doc;
  });

  res.status(201).json({ success: true, data: purchase });
});

const getPurchases = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, startDate, endDate } = req.query;
  const query = { ownerId: req.user._id };
  if (search) {
    query.$or = [
      { purchaseNumber: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
    ];
  }
  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) query.purchaseDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.purchaseDate.$lte = end;
    }
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [purchases, total] = await Promise.all([
    StockPurchase.find(query).sort({ purchaseDate: -1 }).skip(skip).limit(Number(limit)),
    StockPurchase.countDocuments(query),
  ]);
  res.json({
    success: true,
    data: purchases,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await StockPurchase.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!purchase) throw new ApiError(404, 'Purchase not found');
  res.json({ success: true, data: purchase });
});

module.exports = { createPurchase, getPurchases, getPurchase };
