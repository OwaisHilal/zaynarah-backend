// src/features/users/users.routes.js
const router = require('express').Router();
const userCtrl = require('./users.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const {
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
} = require('./users.validation');

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

router.get('/', requireLogin, requireAdmin, userCtrl.getAllUsers);
router.put(
  '/:userId/role',
  requireLogin,
  requireAdmin,
  validate({ body: updateRoleSchema }),
  userCtrl.updateUserRole
);
router.delete('/:userId', requireLogin, requireAdmin, userCtrl.deleteUser);

module.exports = router;
