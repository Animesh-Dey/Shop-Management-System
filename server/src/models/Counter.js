const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.index({ ownerId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
