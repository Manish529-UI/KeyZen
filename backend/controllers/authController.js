const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate a short-lived temp token for OTP verification step
const generateTempToken = (id) => {
  return jwt.sign({ id, purpose: 'otp_verify' }, process.env.JWT_SECRET, { expiresIn: '10m' });
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Hash OTP before storing
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(6);
  return bcrypt.hash(otp, salt);
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      message: 'Account created successfully! Please sign in.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user - Step 1: Verify credentials & send OTP
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is locked (brute force protection)
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account locked due to too many failed attempts. Try again in ${lockTimeRemaining} minute(s).`,
        locked: true,
        lockTimeRemaining,
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
      return res.status(401).json({
        message: attemptsLeft > 0
          ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
          : 'Account locked for 15 minutes due to too many failed attempts.',
        attemptsLeft,
      });
    }

    // Password correct — generate OTP and send via email
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    // Store hashed OTP with 5-minute expiry
    user.otp = hashedOTP;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save({ validateModifiedOnly: true });

    // Send OTP email (handles dev mode fallback internally)
    const emailResult = await sendOTPEmail(user.email, otp, user.name);

    // Return temp token (can only be used for OTP verification)
    const tempToken = generateTempToken(user._id);

    const response = {
      requireOTP: true,
      tempToken,
      email: user.email,
      message: 'Verification code sent to your email',
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Login user - Step 2: Verify OTP and issue full token
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    if (decoded.purpose !== 'otp_verify') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check OTP expiry
    if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(401).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Compare OTP
    const isOTPValid = await bcrypt.compare(otp, user.otp);
    if (!isOTPValid) {
      return res.status(401).json({ message: 'Invalid verification code. Please try again.' });
    }

    // OTP valid — clear OTP fields and reset login attempts
    user.otp = null;
    user.otpExpires = null;
    await user.save({ validateModifiedOnly: true });
    await user.resetLoginAttempts();

    // Issue full JWT token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
const resendOTP = async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    if (decoded.purpose !== 'otp_verify') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    user.otp = hashedOTP;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save({ validateModifiedOnly: true });

    const emailResult = await sendOTPEmail(user.email, otp, user.name);

    const response = {
      message: 'New verification code sent to your email',
    };

    res.json(response);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @desc    Get security status for the current user
// @route   GET /api/auth/security-status
const getSecurityStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      passwordHashing: 'bcrypt (12 rounds)',
      vaultEncryption: 'AES-256-GCM',
      twoFactorAuth: 'Email OTP',
      bruteForceProtection: true,
      rateLimiting: true,
      loginAttempts: user.loginAttempts || 0,
      accountLocked: user.isLocked,
      jwtExpiry: '7 days',
    });
  } catch (error) {
    console.error('Security status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change master password
// @route   PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    // Need to fetch user WITH password field for comparison
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash it

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, verifyOTP, resendOTP, getMe, getSecurityStatus, changePassword };
