const express = require("express");
const router = express.Router();
const {
  getUserById,
  updateUser,
  getAllUsers,
  getEntrepreneurs,
  getInvestors,
  changePassword,
  searchUser,
} = require("../controllers/userController");
const { protect, roleGuard } = require("../middleware/auth");

// Get all users (for sharing)
router.get("/", protect, getAllUsers);

// Search user by email
router.get("/search", protect, searchUser);

// Only investors can browse entrepreneurs and vice versa (plus own role can see their own list)
router.get("/entrepreneurs", protect, getEntrepreneurs);
router.get("/investors", protect, getInvestors);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.put("/:id/change-password", protect, changePassword);

module.exports = router;
