const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/multer");
const documentController = require("../controllers/documentController");

// Document routes - all protected
router.use(protect);

// Upload new document
router.post(
  "/upload",
  upload.single("document"),
  documentController.uploadDocument,
);

// Get user's documents
router.get("/", documentController.getUserDocuments);

// Get documents shared with user
router.get("/shared", documentController.getSharedDocuments);

// Get single document
router.get("/:id", documentController.getDocument);

// Download document file
router.get("/download/:filename", documentController.downloadDocument);

// Update document metadata
router.put("/:id", documentController.updateDocument);

// Create new version of document
router.post(
  "/:id/version",
  upload.single("document"),
  documentController.createDocumentVersion,
);

// Share document with user
router.post("/:id/share", documentController.shareDocument);

// Revoke document access
router.delete("/:id/share/:userId", documentController.revokeAccess);

// Delete document (soft delete)
router.delete("/:id", documentController.deleteDocument);

module.exports = router;
