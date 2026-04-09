const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const signatureController = require("../controllers/signatureController");

// All routes are protected
router.use(protect);

// Create signature (sign a document)
router.post("/", signatureController.createSignature);

// Get signatures by current user
router.get("/user/signatures", signatureController.getUserSignatures);

// Get all signatures for a document
router.get("/document/:documentId", signatureController.getDocumentSignatures);

// Get signature by ID
router.get("/:signatureId", signatureController.getSignature);

// Get audit trail for document
router.get(
  "/document/:documentId/audit",
  signatureController.getSignatureAuditTrail,
);

// Update signature status
router.put("/:signatureId", signatureController.updateSignatureStatus);

// Verify signature
router.post("/:signatureId/verify", signatureController.verifySignature);

// Delete signature
router.delete("/:signatureId", signatureController.deleteSignature);

module.exports = router;
