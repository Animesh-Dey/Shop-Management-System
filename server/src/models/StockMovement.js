const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    movementType: { type: String, required: true, enum: ['Sale', 'Purchase', 'Adjustment'] },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    updatedStock: { type: Number, required: true },
    referenceId: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
