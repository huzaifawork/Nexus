const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["card", "bank_account", "paypal", "wallet"],
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },

  // Card info (for mock)
  card: {
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    holderName: String,
  },

  // Bank account info (for mock)
  bankAccount: {
    accountNumber: String,
    bankName: String,
    accountHolderName: String,
    routingNumber: String,
  },

  // PayPal email
  paypalEmail: String,

  // Wallet balance (for internal wallet)
  walletBalance: {
    type: Number,
    default: 0,
  },

  // Payment gateway references
  stripePaymentMethodId: String,
  paypalId: String,

  status: {
    type: String,
    enum: ["active", "inactive", "expired"],
    default: "active",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one default per user
paymentMethodSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false },
    );
  }
  next();
});

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
