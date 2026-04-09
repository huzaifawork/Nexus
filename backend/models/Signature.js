const mongoose = require("mongoose");

const SignatureSchema = new mongoose.Schema(
  {
    // Signature metadata
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    signedAt: { type: Date, default: Date.now },

    // Signature image/data
    signatureImage: { type: String, required: true }, // Data URL or S3 URL of signature
    signatureType: {
      type: String,
      enum: ["handwritten", "typed", "biometric"],
      default: "handwritten",
    },

    // Associated document
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    // Signature field/location on document
    fieldName: { type: String }, // e.g., "CEO Signature", "Investor Signature"
    location: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },

    // Signature status
    status: {
      type: String,
      enum: ["pending", "signed", "rejected"],
      default: "signed",
    },

    // Additional context
    reason: String, // Why this document was signed
    notes: String, // Any additional notes about the signature

    // Signature verification
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: mongoose.Schema.Types.ObjectId,

    // IP and device info for audit trail
    ipAddress: String,
    userAgent: String,

    // Timestamp server proof (for legal validity)
    timestampProof: String,
  },
  { timestamps: true },
);

// Index for faster queries
SignatureSchema.index({ document: 1, signedBy: 1 });
SignatureSchema.index({ signedBy: 1 });
SignatureSchema.index({ status: 1 });

module.exports = mongoose.model("Signature", SignatureSchema);
