const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    purchasePriceSnapshot: { type: Number, required: true, min: 0 },
    itemTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    items: { type: [saleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    saleDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

saleSchema.index({ ownerId: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ ownerId: 1, saleDate: -1 });

module.exports = mongoose.model('Sale', saleSchema);
