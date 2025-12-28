// src/features/products/products.service.js
const Product = require('./products.model');

exports.listProducts = async (filters) => {
  const {
    page = 1,
    limit = 20,
    category,
    priceMax,
    sort = 'createdAt:desc',
  } = filters;

  const query = {};
  if (category) query.category = category;
  if (priceMax) query.price = { $lte: priceMax };

  const [field, direction] = sort.split(':');
  const sortOptions = { [field]: direction === 'asc' ? 1 : -1 };

  const total = await Product.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const products = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: products,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
  };
};

exports.listAdminProducts = async ({ page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;
  const total = await Product.countDocuments();

  const products = await Product.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: products,
    page: parseInt(page),
    limit: parseInt(limit),
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
