const router = require('express').Router();
const userCtrl = require('./users.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const {
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
  addressSchema,
} = require('./users.validation');

// -------------------------
// AUTH / PROFILE
// -------------------------
router.post('/register', validate(registerSchema), userCtrl.register);

router.get('/me', requireLogin, userCtrl.profile);
router.put(
  '/me',
  requireLogin,
  validate(updateProfileSchema),
  userCtrl.updateProfile
);
router.put(
  '/me/change-password',
  requireLogin,
  validate(changePasswordSchema),
  userCtrl.changePassword
);

// -------------------------
// ADMIN
// -------------------------
router.get('/', requireLogin, requireAdmin, userCtrl.getAllUsers);
router.put(
  '/:userId/role',
  requireLogin,
  requireAdmin,
  validate({ body: updateRoleSchema }),
  userCtrl.updateUserRole
);
router.delete('/:userId', requireLogin, requireAdmin, userCtrl.deleteUser);

// -------------------------
// ADDRESSES
// -------------------------
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

module.exports = router;
