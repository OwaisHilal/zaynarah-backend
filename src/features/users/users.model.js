// src/features/users/users.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'India' },
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  // keep sub-document _id so frontend can reference addresses by id
  { timestamps: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },

    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },

    addresses: [AddressSchema],
  },
  { timestamps: true }
);

// Pre-save hook to hash password only if modified
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Method to compare passwords
UserSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Transform output when converting document to JSON
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    // convert addresses _id to id strings for front-end convenience
    if (Array.isArray(ret.addresses)) {
      ret.addresses = ret.addresses.map((a) => {
        const copy = { ...a };
        if (copy._id) {
          copy.id = copy._id.toString();
          delete copy._id;
        }
        return copy;
      });
    }
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
