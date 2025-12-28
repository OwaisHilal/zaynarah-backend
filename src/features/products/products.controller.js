// src/features/products/products.controller.js
const productService = require('./products.service');

const normalizeProduct = (p) => {
  if (!p) return p;
  return { ...p, id: p._id?.toString?.() || p.id };
};

exports.list = async (req, res, next) => {
  try {
    const { q, category, priceMax, page, limit, sort } = req.validatedQuery;
    const result = await productService.listProducts({
      q,
      category,
      priceMax,
      page,
      limit,
      sort,
    });
    result.data = result.data.map(normalizeProduct);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await productService.listAdminProducts({ page, limit });
    result.data = result.data.map(normalizeProduct);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const product = await productService.getProductById(id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(normalizeProduct(product));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.validatedBody);
    res.json(normalizeProduct(product));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const product = await productService.updateProduct(id, req.validatedBody);
    res.json(normalizeProduct(product));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.validatedParams;
    const removed = await productService.removeProduct(id);
    res.json(removed);
  } catch (err) {
    next(err);
  }
};
