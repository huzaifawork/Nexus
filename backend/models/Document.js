const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // File information
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // in bytes
    fileUrl: { type: String, required: true }, // Path or S3 URL

    // Metadata
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: { type: Date, default: Date.now },

    // Versioning
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        version: Number,
        fileUrl: String,
        uploadedAt: Date,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["draft", "active", "archived", "signed"],
      default: "active",
    },

    // Sharing
    sharedWith: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        permission: {
          type: String,
          enum: ["view", "edit", "sign"],
          default: "view",
        },
        sharedAt: { type: Date, default: Date.now },
      },
    ],

    // Signatures
    signatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Signature" }],

    // Related meeting or collaboration
    associatedType: {
      type: String,
      enum: ["meeting", "collaboration", "general"],
      default: "general",
    },
    associatedId: mongoose.Schema.Types.ObjectId,

    // Tags for organization
    tags: [{ type: String }],

    // Deletion
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);

// Index for faster queries
DocumentSchema.index({ uploadedBy: 1, status: 1 });
DocumentSchema.index({ "sharedWith.userId": 1 });
DocumentSchema.index({ tags: 1 });

module.exports = mongoose.model("Document", DocumentSchema);
