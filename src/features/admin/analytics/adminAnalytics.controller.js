// backend/src/features/admin/analytics/adminAnalytics.controller.js

const Order = require('../../orders/orders.model');
const User = require('../../users/users.model');
const Product = require('../../products/products.model');
const mongoose = require('mongoose');

exports.getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const twoMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 2,
      now.getDate()
    );

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      paidOrders,
      revenueAgg,
      prevRevenueAgg,
      lowStockCount,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: lastMonth } } },
        { $group: { _id: null, total: { $sum: '$cartTotal.grand' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$cartTotal.grand' } } },
      ]),
      Product.countDocuments({ stock: { $lte: 5 } }),
    ]);

    const currentRevenue = revenueAgg[0]?.total || 0;
    const prevRevenue = prevRevenueAgg[0]?.total || 0;
    const revenueTrend =
      prevRevenue === 0
        ? 100
        : (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      paidOrders,
      revenue: currentRevenue,
      revenueTrend: parseFloat(revenueTrend),
      lowStockCount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold || 5);
    const products = await Product.find({
      stock: { $exists: true, $lte: threshold },
    })
      .select('title stock category images image price')
      .sort({ stock: 1 })
      .limit(10)
      .lean();

    res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.getOrdersTrend = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paid'] },
                '$cartTotal.grand',
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getPaymentsBreakdown = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$cartTotal.grand' },
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getRecentOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'email name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    res.json(orders);
  } catch (err) {
    next(err);
  }
};
