const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true, default: '' },
    sku: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, required: true, min: 0, default: 0 },
    unit: {
      type: String,
      required: true,
      enum: ['Piece', 'Kg', 'Gram', 'Litre', 'Millilitre', 'Packet', 'Dozen', 'Box'],
    },
  },
  { timestamps: true }
);

productSchema.index({ ownerId: 1, name: 1 });
productSchema.index({ ownerId: 1, barcode: 1 });
productSchema.index({ ownerId: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);
