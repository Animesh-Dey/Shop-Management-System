const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    itemTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const stockPurchaseSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purchaseNumber: { type: String, required: true },
    supplierName: { type: String, default: '' },
    items: { type: [purchaseItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    additionalNotes: { type: String, default: '' },
    grandTotal: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

stockPurchaseSchema.index({ ownerId: 1, purchaseNumber: 1 }, { unique: true });
stockPurchaseSchema.index({ ownerId: 1, purchaseDate: -1 });

module.exports = mongoose.model('StockPurchase', stockPurchaseSchema);
