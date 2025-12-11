// src/feature/products/products.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Variant Schema ---
const VariantSchema = new Schema(
  {
    // SKU is critical and should be unique across all products for inventory
    sku: {
      type: String,
      required: true,
      unique: true, // Requires special setup with Mongoose if used as a subdocument, but good practice
      trim: true,
    },
    // 'options' holds the attributes that define this variant (e.g., { color: 'Red', size: 'M' })
    options: {
      type: Schema.Types.Mixed,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Price cannot be negative
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // Stock cannot be negative
    },
  },
  { _id: false } // We don't need Mongoose-generated IDs for variants
);

// --- Product Schema ---
const ProductSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    variants: {
      type: [VariantSchema],
      default: [],
    },
    // Keep this if you want a top-level stock for simple, non-variant products
    // If the product has variants, this field should ideally be calculated (virtual or middleware).
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      default: '',
      trim: true,
      index: true, // Add index for query speed
    },
    metadata: {
      type: Object,
      default: {},
    },
    // You might want an 'isActive' or 'isPublished' field
    isPublished: {
      type: Boolean,
      default: false,
      index: true, // Useful for filtering published products
    },
  },
  { timestamps: true }
);

// OPTIONAL: Add a virtual field for total stock if using variants
ProductSchema.virtual('totalStock').get(function () {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((acc, variant) => acc + variant.stock, 0);
  }
  return this.stock; // Fallback to top-level stock if no variants
});

// OPTIONAL: Add a unique index on the title field to prevent duplicate products
ProductSchema.index({ title: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);
