// src/features/auth/auth.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema(
  {
    name: String,
    details: String,
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
