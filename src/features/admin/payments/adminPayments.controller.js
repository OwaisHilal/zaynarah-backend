const Order = require('../../orders/orders.model');

exports.listPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, status, provider } = req.query;

    const query = {};

    if (status) query.paymentStatus = status;
    if (provider) query.paymentProvider = provider;

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Order.countDocuments(query);

    const payments = await Order.find(query)
      .populate('user', 'email name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const data = payments.map((o) => ({
      orderId: o._id,
      user: o.user,
      amount: o.cartTotal?.grand,
      currency: o.cartTotal?.currency,
      paymentProvider: o.paymentProvider,
      paymentIntentId: o.paymentIntentId,
      paymentStatus: o.paymentStatus,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
    }));

    res.json({
      data,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};
