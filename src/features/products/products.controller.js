// src/features/products/products.controller.js
const Product = require('./products.model');

exports.list = async (req, res, next) => {
  try {
    const products = await Product.find().limit(200);
    res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const p = await Product.create(req.body);
    res.json(p);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(p);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
