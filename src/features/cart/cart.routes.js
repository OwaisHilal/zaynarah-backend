// src/features/cart/cart.routes.js
const router = require('express').Router();
const ctrl = require('./cart.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const {
  addItemSchema,
  updateItemSchema,
  removeItemSchema,
  adminGetCartsSchema,
} = require('./cart.validation');

router.get('/', requireLogin, ctrl.getCart);
router.post('/add', requireLogin, validate(addItemSchema), ctrl.addItem);
router.post('/merge', requireLogin, ctrl.mergeCart);

router.put(
  '/update/:productId',
  requireLogin,
  validate({ body: updateItemSchema, params: removeItemSchema }),
  ctrl.updateItem
);

router.delete(
  '/remove/:productId',
  requireLogin,
  validate({ params: removeItemSchema }),
  ctrl.removeItem
);

router.delete('/clear', requireLogin, ctrl.clearCart);

router.get(
  '/all',
  requireLogin,
  requireAdmin,
  validate({ query: adminGetCartsSchema }),
  ctrl.getAllCarts
);

module.exports = router;
