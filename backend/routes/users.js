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
const { protect, authorize, isOwner } = require("../middleware/auth");

// Get all users (for sharing) - any authenticated user
router.get("/", protect, getAllUsers);

// Search user by email - any authenticated user
router.get("/search", protect, searchUser);

// Get entrepreneurs - any authenticated user
router.get("/entrepreneurs", protect, getEntrepreneurs);

// Get investors - any authenticated user
router.get("/investors", protect, getInvestors);

// Get user by ID - any authenticated user (public profile info)
router.get("/:id", protect, getUserById);

// Update user profile - only the user can update their own profile
router.put("/:id", protect, isOwner, updateUser);

// Change password - all authenticated users can change their own password
router.put("/:id/change-password", protect, isOwner, changePassword);

module.exports = router;
