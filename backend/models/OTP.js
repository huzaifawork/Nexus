const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 10 * 60 * 1000, // 10 minutes
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiration
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OTP', OTPSchema);
