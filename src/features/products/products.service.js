// src/features/products/products.service.js
const Product = require('./products.model');

exports.listProducts = async (filters) => {
  const {
    page = 1,
    limit = 20,
    category,
    priceMax,
    sort = 'createdAt:desc',
    q,
  } = filters;

  const query = {};

  // Category filter
  if (category) {
    query.category = category;
  }

  // Price filter
  if (priceMax) {
    query.price = { $lte: priceMax };
  }

  // 🔍 SEARCH (FIX)
  if (q) {
    const regex = new RegExp(q, 'i'); // case-insensitive
    query.$or = [{ title: regex }, { description: regex }, { category: regex }];
  }

  // Sorting
  const [field, direction] = sort.split(':');
  const sortOptions = {
    [field]: direction === 'asc' ? 1 : -1,
  };

  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
  ]);

  return {
    data: products,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

exports.listAdminProducts = async ({ page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    Product.countDocuments(),
    Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return {
    data: products,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

exports.getProductById = async (id) => {
  return Product.findById(id).lean();
};

exports.createProduct = async (productData) => {
  const product = new Product(productData);
  await product.save();
  return product.toObject();
};

exports.updateProduct = async (id, updateData) => {
  return Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean();
};

exports.removeProduct = async (id) => {
  return Product.findByIdAndDelete(id).lean();
};
