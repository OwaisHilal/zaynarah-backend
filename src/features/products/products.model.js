// src/features/products/products.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantSchema = new Schema(
  {
    sku: String,
    options: Schema.Types.Mixed,
    price: Number,
    stock: Number,
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    title: String,
    description: String,
    price: Number,
    images: [String],
    variants: [VariantSchema],
    metadata: { type: Object, default: {} },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
