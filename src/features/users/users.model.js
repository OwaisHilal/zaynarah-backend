// src/features/users/users.model.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema(
  {
    name: String,
    details: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

// ✅ FIXED pre-save hook: Removed 'next' parameter and calls to 'next()'.
// Mongoose automatically waits for an async pre-hook to resolve.
UserSchema.pre('save', async function () {
  // 👇 The error was originating from this line (line 27 in your log) when calling it with 'next'.
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  } // No need to call next() here. If an error occurs, Mongoose will catch the thrown exception.
});

// Method to compare passwords
UserSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
