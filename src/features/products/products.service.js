// src/feature/products/products.service.js
const Product = require('./products.model'); // Assuming the model is correctly exported from its file
const { getPaginatedData } = require('../../core/utils/pagination'); // Assuming you have a pagination utility here

// If you don't have a separate utility for Mongoose pagination,
// we can use a helper function directly in this file.

/**
 * Fetches a list of products with filtering, sorting, and pagination.
 *
 * @param {object} filters - Contains query parameters (page, limit, category, priceMax, sort).
 * @returns {Promise<object>} - The paginated result object { data: [...], total, page, totalPages, limit }.
 */
exports.listProducts = async (filters) => {
  const {
    page = 1,
    limit = 20,
    category,
    priceMax,
    sort = 'createdAt:desc',
  } = filters;

  // 1. Build Query (Mongoose criteria)
  const query = {};
  if (category) {
    query.category = category;
  }
  if (priceMax) {
    // Price less than or equal to priceMax
    query.price = { $lte: priceMax };
  }

  // 2. Determine Sort
  const [field, direction] = sort.split(':');
  const sortOptions = {};
  // Convert 'asc'/'desc' to 1/-1 for Mongoose
  sortOptions[field] = direction === 'asc' ? 1 : -1;

  // 3. Fetch Data and Paginate
  const total = await Product.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const products = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean(); // Use .lean() for plain JavaScript objects, improving performance

  // 4. Return the structure required by the frontend
  return {
    data: products,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
  };
};

/**
 * Fetches a single product by ID.
 */
exports.getProductById = async (id) => {
  return Product.findById(id).lean();
};

/**
 * Creates a new product.
 */
exports.createProduct = async (productData) => {
  const product = new Product(productData);
  await product.save();
  return product.toObject();
};

/**
 * Updates an existing product by ID.
 */
exports.updateProduct = async (id, updateData) => {
  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean();
  return product;
};

/**
 * Removes a product by ID.
 */
exports.removeProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id).lean();
  return product;
};
