// backend/src/features/users/users.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  email: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  postalCode: String,
  country: { type: String, default: 'India' },
  type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: String,
    emailVerifyTokenExpires: Date,

    passwordResetToken: String,
    passwordResetTokenExpires: Date,

    addresses: [AddressSchema],
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

UserSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.password;
    delete ret.emailVerifyToken;
    delete ret.emailVerifyTokenExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetTokenExpires;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
