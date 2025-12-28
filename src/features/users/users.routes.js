// src/features/users/users.routes.js
const router = require('express').Router();
const userCtrl = require('./users.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const {
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
  addressSchema,
  listUsersQuerySchema,
} = require('./users.validation');

router.get('/me', requireLogin, userCtrl.profile);

router.put(
  '/me',
  requireLogin,
  validate({ body: updateProfileSchema }),
  userCtrl.updateProfile
);

router.put(
  '/me/change-password',
  requireLogin,
  validate({ body: changePasswordSchema }),
  userCtrl.changePassword
);

router.get(
  '/',
  requireLogin,
  requireAdmin,
  validate({ query: listUsersQuerySchema }),
  userCtrl.getAllUsers
);

router.put(
  '/:userId/role',
  requireLogin,
  requireAdmin,
  validate({
    params: require('zod').object({ userId: require('zod').string() }),
    body: updateRoleSchema,
  }),
  userCtrl.updateUserRole
);

router.delete('/:userId', requireLogin, requireAdmin, userCtrl.deleteUser);

router.get('/addresses', requireLogin, userCtrl.getAddresses);

router.post(
  '/addresses',
  requireLogin,
  validate({ body: addressSchema }),
  userCtrl.addAddress
);

router.put(
  '/addresses/:addressId',
  requireLogin,
  validate({ body: addressSchema }),
  userCtrl.updateAddress
);

router.delete('/addresses/:addressId', requireLogin, userCtrl.deleteAddress);

router.put(
  '/addresses/:addressId/default',
  requireLogin,
  userCtrl.setDefaultAddress
);

module.exports = router;
