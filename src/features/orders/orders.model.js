const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    qty: Number,
    unitPrice: Number,
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    name: String,
    details: String,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    items: [OrderItemSchema],
    totalAmount: Number,
    currency: { type: String, default: 'INR' },
    address: AddressSchema,
    status: {
      type: String,
      enum: [
        'pending',
        'paid',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    paymentProvider: String,
    paymentIntentId: String,
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
