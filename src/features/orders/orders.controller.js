// src/features/orders/orders.controller.js
const Order = require('./orders.model');

exports.create = async (req, res, next) => {
  try {
    const { items, address, totalAmount, currency } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ message: 'No items' });
    const order = await Order.create({
      user: req.user ? req.user._id : undefined,
      items,
      address,
      totalAmount,
      currency: currency || 'INR',
      status: 'pending',
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (
      req.user.role !== 'admin' &&
      (!order.user || !order.user.equals(req.user._id))
    )
      return res.status(403).json({ message: 'Forbidden' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
};
