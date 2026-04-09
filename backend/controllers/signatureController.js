const Signature = require("../models/Signature");
const Document = require("../models/Document");
const User = require("../models/User");

// Create a new signature
exports.createSignature = async (req, res) => {
  try {
    const {
      documentId,
      signatureImage,
      signatureType,
      fieldName,
      location,
      reason,
      notes,
    } = req.body;

    // Validate required fields
    if (!documentId || !signatureImage) {
      return res
        .status(400)
        .json({ error: "Document ID and signature image are required" });
    }

    // Check if document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission - can sign if owner or has 'sign' permission
    const canSign =
      document.uploadedBy.toString() === req.user._id.toString() ||
      document.sharedWith.some(
        (s) =>
          s.userId.toString() === req.user._id.toString() &&
          s.permission === "sign",
      );

    if (!canSign) {
      return res
        .status(403)
        .json({ error: "You do not have permission to sign this document" });
    }

    // Get client IP
    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      req.headers["x-forwarded-for"] ||
      "Unknown";

    // Create signature record
    const signature = new Signature({
      signedBy: req.user._id,
      signatureImage,
      signatureType: signatureType || "handwritten",
      document: documentId,
      fieldName: fieldName || "Signature",
      location: location || {},
      reason: reason || "",
      notes: notes || "",
      status: "signed",
      ipAddress,
      userAgent: req.headers["user-agent"],
      isVerified: false,
    });

    await signature.save();
    await signature.populate("signedBy", "name email avatarUrl");

    // Add signature to document
    if (!document.signatures.includes(signature._id)) {
      document.signatures.push(signature._id);

      // Update document status to signed if all required signatures are present
      if (document.signatures.length > 0) {
        document.status = "signed";
      }
      await document.save();
    }

    res.status(201).json({
      message: "Document signed successfully",
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get signatures for a document
exports.getDocumentSignatures = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Check if document exists and user has access
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const canAccess =
      document.uploadedBy.toString() === req.user._id.toString() ||
      document.sharedWith.some(
        (s) => s.userId.toString() === req.user._id.toString(),
      );

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all signatures for the document
    const signatures = await Signature.find({ document: documentId })
      .populate("signedBy", "name email avatarUrl")
      .sort({ signedAt: -1 });

    res.json({
      total: signatures.length,
      signatures,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get signature by ID
exports.getSignature = async (req, res) => {
  try {
    const { signatureId } = req.params;

    const signature = await Signature.findById(signatureId)
      .populate("signedBy", "name email avatarUrl")
      .populate("document");

    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    // Check permission
    const document = signature.document;
    const canAccess =
      document.uploadedBy.toString() === req.user._id.toString() ||
      document.sharedWith.some(
        (s) => s.userId.toString() === req.user._id.toString(),
      );

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(signature);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get signatures by current user
exports.getUserSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find({ signedBy: req.user._id })
      .populate("document", "title originalName uploadedBy")
      .sort({ signedAt: -1 });

    res.json({
      total: signatures.length,
      signatures,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update signature status
exports.updateSignatureStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { signatureId } = req.params;

    if (!["pending", "signed", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const signature = await Signature.findById(signatureId);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    // Check permission - only document owner can update
    const document = await Document.findById(signature.document);
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    signature.status = status;
    if (status === "signed") {
      signature.isVerified = true;
      signature.verifiedAt = new Date();
      signature.verifiedBy = req.user._id;
    }

    await signature.save();
    await signature.populate("signedBy", "name email avatarUrl");

    res.json({
      message: "Signature status updated",
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete signature (soft delete)
exports.deleteSignature = async (req, res) => {
  try {
    const { signatureId } = req.params;

    const signature = await Signature.findById(signatureId);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    // Check permission - only document owner can delete
    const document = await Document.findById(signature.document);
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Remove from document's signatures array
    document.signatures = document.signatures.filter(
      (sig) => sig.toString() !== signatureId,
    );
    await document.save();

    // Delete signature
    await Signature.findByIdAndDelete(signatureId);

    res.json({
      message: "Signature deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify signature authenticity
exports.verifySignature = async (req, res) => {
  try {
    const { signatureId } = req.params;

    const signature = await Signature.findById(signatureId);
    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    // Check permission
    const document = await Document.findById(signature.document);
    const canAccess =
      document.uploadedBy.toString() === req.user._id.toString() ||
      document.sharedWith.some(
        (s) => s.userId.toString() === req.user._id.toString(),
      );

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Mark as verified
    signature.isVerified = true;
    signature.verifiedAt = new Date();
    signature.verifiedBy = req.user._id;

    await signature.save();
    await signature.populate("signedBy", "name email avatarUrl");

    res.json({
      message: "Signature verified",
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get audit trail for document signatures
exports.getSignatureAuditTrail = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
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

    // Get all signatures with full details
    const signatures = await Signature.find({ document: documentId })
      .populate("signedBy", "name email avatarUrl")
      .populate("verifiedBy", "name email")
      .sort({ signedAt: -1 });

    const auditTrail = {
      documentId,
      documentTitle: document.title,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt,
      documentVersion: document.version,
      signatures: signatures.map((sig) => ({
        signatureId: sig._id,
        signedBy: sig.signedBy,
        signedAt: sig.signedAt,
        status: sig.status,
        isVerified: sig.isVerified,
        verifiedAt: sig.verifiedAt,
        verifiedBy: sig.verifiedBy,
        signatureType: sig.signatureType,
        fieldName: sig.fieldName,
        reason: sig.reason,
        ipAddress: sig.ipAddress,
        userAgent: sig.userAgent,
      })),
    };

    res.json(auditTrail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
