// src/features/products/products.routes.js
const express = require('express');
const ctrl = require('./products.controller');
const { auth, admin } = require('../../middlewares/auth');
const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', auth, admin, ctrl.create);
router.put('/:id', auth, admin, ctrl.update);
router.delete('/:id', auth, admin, ctrl.remove);

module.exports = router;
