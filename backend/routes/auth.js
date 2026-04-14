const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyOTP,
  resendOTP,
  refreshToken,
} = require("../controllers/authController");
const mockEmailService = require("../services/mockEmailService");
const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

// Register with enhanced validation
router.post(
  "/register",
  [
    body("name")
      .notEmpty()
      .trim()
      .withMessage("Name is required")
      .isLength({ max: 100 })
      .withMessage("Name too long"),
    body("email")
      .isEmail()
      .trim()
      .toLowerCase()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "Password must contain uppercase, lowercase, number, and special character",
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password)
        throw new Error("Passwords do not match");
      return true;
    }),
    body("role")
      .isIn(["entrepreneur", "investor"])
      .withMessage("Role must be entrepreneur or investor"),
    validate,
  ],
  register,
);

// Login with enhanced validation (returns OTP requirement)
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .trim()
      .toLowerCase()
      .withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role")
      .isIn(["entrepreneur", "investor"])
      .withMessage("Role must be entrepreneur or investor"),
    validate,
  ],
  login,
);

// Verify OTP for 2FA
router.post(
  "/verify-otp",
  [
    body("otpId").notEmpty().withMessage("OTP ID is required"),
    body("code")
      .matches(/^\d{6}$/)
      .withMessage("OTP must be 6 digits"),
    validate,
  ],
  verifyOTP,
);

// Resend OTP
router.post(
  "/resend-otp",
  [body("otpId").notEmpty().withMessage("OTP ID is required"), validate],
  resendOTP,
);

// Refresh access token
router.post(
  "/refresh-token",
  [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
    validate,
  ],
  refreshToken,
);

// Forgot password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required"), validate],
  forgotPassword,
);

// Reset password with enhanced validation
router.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "Password must contain uppercase, lowercase, number, and special character",
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password)
        throw new Error("Passwords do not match");
      return true;
    }),
    validate,
  ],
  resetPassword,
);

// 🧪 TEST ENDPOINT: Get latest OTP for an email (Development Only)
router.get("/test/otp/:email", (req, res) => {
  const otp = mockEmailService.getLatestOTP(req.params.email);
  if (!otp) {
    return res.status(404).json({ message: "No OTP found for this email" });
  }
  res.json({ email: req.params.email, otp, message: "OTP from mock service" });
});

// 🧪 TEST ENDPOINT: Get all mock emails (Development Only)
router.get("/test/emails", (req, res) => {
  const emails = mockEmailService.getMockEmails();
  res.json({ count: emails.length, emails });
});

// 🧪 TEST ENDPOINT: Clear mock emails (Development Only)
router.post("/test/clear-emails", (req, res) => {
  mockEmailService.clearMockEmails();
  res.json({ message: "Mock email log cleared" });
});

module.exports = router;
