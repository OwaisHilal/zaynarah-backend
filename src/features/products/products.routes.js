// src/features/products/products.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./products.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const {
  createProductSchema,
  updateProductSchema,
  listProductsQuery,
  idParamSchema,
} = require('./products.validation');

// --- Public routes ---
router.get('/', validate({ query: listProductsQuery }), ctrl.list);
router.get('/:id', validate({ params: idParamSchema }), ctrl.get);

// --- Admin routes ---
router.get('/admin', requireLogin, requireAdmin, ctrl.listAdmin);

router.post(
  '/',
  requireLogin,
  requireAdmin,
  validate(createProductSchema),
  ctrl.create
);

router.put(
  '/:id',
  requireLogin,
  requireAdmin,
  validate({ body: updateProductSchema, params: idParamSchema }),
  ctrl.update
);

router.delete(
  '/:id',
  requireLogin,
  requireAdmin,
  validate({ params: idParamSchema }),
  ctrl.remove
);

module.exports = router;
