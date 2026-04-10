const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  deposit,
  withdraw,
  transfer,
  getTransactions,
  getTransactionDetail,
  getWalletBalance,
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
} = require("../controllers/paymentController");

// All payment routes require authentication
router.use(protect);

// Transaction endpoints
router.post("/deposit", deposit);
router.post("/withdraw", withdraw);
router.post("/transfer", transfer);

// Transaction history
router.get("/transactions", getTransactions);
router.get("/transactions/:id", getTransactionDetail);

// Wallet
router.get("/wallet", getWalletBalance);

// Payment methods
router.post("/payment-methods", addPaymentMethod);
router.get("/payment-methods", getPaymentMethods);
router.delete("/payment-methods/:id", deletePaymentMethod);

module.exports = router;
