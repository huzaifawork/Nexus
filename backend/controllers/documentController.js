const Document = require("../models/Document");
const Signature = require("../models/Signature");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// Upload a new document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, description, tags, associatedType, associatedId } = req.body;

    // Create relative file URL for serving
    const fileUrl = `/api/documents/download/${req.file.filename}`;

    // Create document record
    const document = new Document({
      title: title || req.file.originalname,
      description: description || "",
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      associatedType: associatedType || "general",
      associatedId: associatedId || null,
      status: "active",
    });

    await document.save();
    await document.populate("uploadedBy", "name email avatarUrl");

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all documents for current user
exports.getUserDocuments = async (req, res) => {
  try {
    const { status, tag, associated } = req.query;

    let query = {
      $or: [
        { uploadedBy: req.user._id },
        { "sharedWith.userId": req.user._id },
      ],
      isDeleted: false,
    };

    if (status) query.status = status;
    if (tag) query.tags = tag;
    if (associated) query.associatedType = associated;

    const documents = await Document.find(query)
      .populate("uploadedBy", "name email avatarUrl")
      .populate("sharedWith.userId", "name email avatarUrl")
      .populate("signatures")
      .sort({ uploadedAt: -1 });

    res.json({
      total: documents.length,
      documents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single document by ID
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("uploadedBy", "name email avatarUrl")
      .populate("sharedWith.userId", "name email avatarUrl")
      .populate("signatures");

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission
    const canAccess =
      document.uploadedBy._id.toString() === req.user._id.toString() ||
      document.sharedWith.some(
        (s) => s.userId._id.toString() === req.user._id.toString(),
      );

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download document file
exports.downloadDocument = async (req, res) => {
  try {
    const { filename } = req.params;

    // Find document to verify permissions
    const document = await Document.findOne({ filename });
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission
    const canAccess =
      document.uploadedBy.toString() === req.user._id.toString() ||
      document.sharedWith.some(
        (s) => s.userId.toString() === req.user._id.toString(),
      );

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get file from the original uploader's directory, not current user
    const filePath = path.join(
      __dirname,
      `../uploads/${document.uploadedBy.toString()}/${filename}`,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update document metadata
exports.updateDocument = async (req, res) => {
  try {
    const { title, description, tags, status } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission (only owner can edit)
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (title) document.title = title;
    if (description) document.description = description;
    if (tags) document.tags = tags.split(",").map((t) => t.trim());
    if (status && ["draft", "active", "archived", "signed"].includes(status)) {
      document.status = status;
    }

    await document.save();
    await document.populate("uploadedBy", "name email avatarUrl");
    await document.populate("signatures");

    res.json({
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Share document with other users
exports.shareDocument = async (req, res) => {
  try {
    const { userId, permission } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission (only owner can share)
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already shared
    const alreadyShared = document.sharedWith.some(
      (s) => s.userId.toString() === userId,
    );
    if (alreadyShared) {
      return res
        .status(400)
        .json({ error: "Document already shared with this user" });
    }

    // Add to sharedWith
    document.sharedWith.push({
      userId,
      permission: permission || "view",
    });

    await document.save();
    await document.populate("sharedWith.userId", "name email avatarUrl");

    res.json({
      message: "Document shared successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Revoke document access
exports.revokeAccess = async (req, res) => {
  try {
    const { userId } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    document.sharedWith = document.sharedWith.filter(
      (s) => s.userId.toString() !== userId,
    );

    await document.save();

    res.json({
      message: "Access revoked successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete document (soft delete)
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission (only owner can delete)
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Soft delete
    document.isDeleted = true;
    document.deletedAt = new Date();
    document.deletedBy = req.user._id;

    await document.save();

    res.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get documents shared with user
exports.getSharedDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      "sharedWith.userId": req.user._id,
      isDeleted: false,
    })
      .populate("uploadedBy", "name email avatarUrl")
      .populate("signatures")
      .sort({ uploadedAt: -1 });

    res.json({
      total: documents.length,
      documents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new version of a document
exports.createDocumentVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Store current version in history
    document.previousVersions.push({
      version: document.version,
      fileUrl: document.fileUrl,
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
    });

    // Update to new version
    document.version += 1;
    document.filename = req.file.filename;
    document.originalName = req.file.originalname;
    document.mimeType = req.file.mimetype;
    document.size = req.file.size;
    document.fileUrl = `/api/documents/download/${req.file.filename}`;
    document.uploadedAt = new Date();

    await document.save();
    await document.populate("uploadedBy", "name email avatarUrl");

    res.json({
      message: "New version created successfully",
      document,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};
