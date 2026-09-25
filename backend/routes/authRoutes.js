const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  getMe,
  getSecurityStatus,
  changePassword,
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Public routes (with rate limiting)
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);

// Protected routes
router.get('/me', auth, getMe);
router.get('/security-status', auth, getSecurityStatus);
router.put('/password', auth, changePassword);

module.exports = router;
