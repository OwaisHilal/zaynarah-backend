// src/features/shipping/shipping.controller.js
const shippingService = require('./shipping.service');

module.exports = {
  // POST /shipping/methods  (expects body: { address, weight, itemsCount })
  getMethods: async (req, res, next) => {
    try {
      const { address = {}, weight = 0, itemsCount = 0 } = req.body || {};
      const methods = await shippingService.getShippingMethods(address, {
        weight,
        itemsCount,
      });
      res.json(methods);
    } catch (err) {
      next(err);
    }
  },

  // POST /shipping/calculate
  // body: { method, weight, itemsCount }
  calculate: async (req, res, next) => {
    try {
      const { method, weight = 0, itemsCount = 0 } = req.body || {};
      const cost = await shippingService.calculateShippingCost(method, {
        weight,
        itemsCount,
      });
      res.json({ cost });
    } catch (err) {
      next(err);
    }
  },
};
