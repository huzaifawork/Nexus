const User = require("../models/User");

// @route  GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user._id.toString() !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this profile" });
    }

    const updates = req.body;
    delete updates.password;
    Object.assign(user, updates);
    await user.save();

    const updated = await User.findById(user._id).select("-password");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/users/:id/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id);
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/users/entrepreneurs
const getEntrepreneurs = async (req, res) => {
  try {
    const entrepreneurs = await User.find({ role: "entrepreneur" }).select(
      "-password",
    );
    res.json(entrepreneurs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/users/investors
const getInvestors = async (req, res) => {
  try {
    const investors = await User.find({ role: "investor" }).select("-password");
    res.json(investors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/users/search
const searchUser = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserById,
  updateUser,
  changePassword,
  getAllUsers,
  getEntrepreneurs,
  getInvestors,
  searchUser,
};
