const Order = require('../../orders/orders.model');
const User = require('../../users/users.model');
const Product = require('../../products/products.model');

exports.getSummary = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, paidOrders, revenueAgg] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ paymentStatus: 'paid' }),
        Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          {
            $group: {
              _id: null,
              total: { $sum: '$cartTotal.grand' },
            },
          },
        ]),
      ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      paidOrders,
      revenue: revenueAgg[0]?.total || 0,
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
      .select('title stock category images image')
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
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
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
          _id: {
            provider: '$paymentProvider',
            status: '$paymentStatus',
          },
          count: { $sum: 1 },
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
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json(orders);
  } catch (err) {
    next(err);
  }
};
