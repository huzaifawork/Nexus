const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { sanitizeString, sanitizeEmail } = require('../middleware/sanitize');

// Generate JWT Access Token (short-lived)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate JWT Refresh Token (long-lived)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate OTP Code (6 digits)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'localhost',
      port: process.env.EMAIL_PORT || 1025,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } : undefined,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@nexus.com',
      to: email,
      subject: '🔐 Nexus 2FA OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Two-Factor Authentication Code</h2>
          <p style="color: #666; font-size: 16px;">Enter this code to verify your identity:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1a1a1a; letter-spacing: 5px; font-size: 48px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #999; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// @route  POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;
  try {
    // Validate input
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return res.status(400).json({
        message: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)',
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = sanitizeEmail(email);

    // Check if user exists
    const userExists = await User.findOne({ email: sanitizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password,
      role,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
      message: 'Registration successful! Next: Enable 2FA for enhanced security.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// @route  POST /api/auth/login
const login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const sanitizedEmail = sanitizeEmail(email);

    const user = await User.findOne({ email: sanitizedEmail, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate OTP for 2FA
    const otpCode = generateOTP();
    await OTP.deleteMany({ userId: user._id }); // Delete old OTPs

    const otpRecord = await OTP.create({
      userId: user._id,
      email: user.email,
      code: otpCode,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otpCode);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }

    res.json({
      _id: user._id,
      message: 'OTP sent to your email. Please verify to complete login.',
      requiresOTPVerification: true,
      otpId: otpRecord._id,
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// @route  POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Nexus Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 10 minutes.</p>`,
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  const { otpId, code } = req.body;
  try {
    if (!otpId || !code) {
      return res.status(400).json({ message: 'OTP ID and code are required' });
    }

    const otpRecord = await OTP.findById(otpId);
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    if (otpRecord.expiresAt < Date.now()) {
      await OTP.deleteOne({ _id: otpId });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 3)
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpId });
      return res.status(400).json({ message: 'Maximum OTP attempts exceeded. Request a new OTP.' });
    }

    if (otpRecord.code !== code.toString().trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        message: `Invalid OTP. Attempts remaining: ${3 - otpRecord.attempts}`,
      });
    }

    // OTP verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Get user details
    const user = await User.findById(otpRecord.userId);

    // Mark as online
    user.isOnline = true;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      accessToken,
      refreshToken,
      message: '✅ Login successful!',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// @route  POST /api/auth/resend-otp
const resendOTP = async (req, res) => {
  const { otpId } = req.body;
  try {
    if (!otpId) {
      return res.status(400).json({ message: 'OTP ID is required' });
    }

    const otpRecord = await OTP.findById(otpId);
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found' });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    otpRecord.code = newOtp;
    otpRecord.attempts = 0;
    otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await otpRecord.save();

    // Send new OTP email
    const emailSent = await sendOTPEmail(otpRecord.email, newOtp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

// @route  POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  try {
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, verifyOTP, resendOTP, refreshToken };
