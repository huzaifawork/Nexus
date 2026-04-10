const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "transfer_out", "transfer_in", "refund"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "PKR"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "pending",
  },
  description: String,

  // Payment method info
  paymentMethod: {
    type: String,
    enum: ["card", "bank_transfer", "paypal", "wallet"],
    default: "card",
  },

  // For transfers
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Payment gateway info
  stripePaymentIntentId: String,
  paypalTransactionId: String,

  // Fee information
  fee: {
    type: Number,
    default: 0,
  },
  feeReason: String,

  // Metadata
  metadata: {
    cardLast4: String,
    bankName: String,
    relatedMeetingId: mongoose.Schema.Types.ObjectId,
    relatedDocumentId: mongoose.Schema.Types.ObjectId,
    notes: String,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  failureReason: String,
});

// Indexes for performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Calculate net amount (amount - fee)
transactionSchema.virtual("netAmount").get(function () {
  return this.amount - this.fee;
});

module.exports = mongoose.model("Transaction", transactionSchema);
