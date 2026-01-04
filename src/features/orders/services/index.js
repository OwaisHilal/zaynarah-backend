const checkoutService = require('./checkout.service');
const invoiceService = require('./invoice.service');
const statusService = require('./status.service');

module.exports = {
  ...checkoutService,
  ...invoiceService,
  ...statusService,
};
