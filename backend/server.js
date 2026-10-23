const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env variables FIRST
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware — CORS configured for frontend, Vercel deployments & browser extension
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5000',  // Backend (self)
  process.env.CLIENT_URL,   // Production frontend URL (Vercel)
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow Chrome extension origins (chrome-extension://...)
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    // Allow any Vercel preview or production deployment (*.vercel.app)
    if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') return callback(null, true);
    // Allow whitelisted origins
    if (allowedOrigins.some(o => origin === o || origin.startsWith(o))) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Global API rate limiter (100 requests per 15 min)
app.use('/api', apiLimiter);

// Root route for Render liveness & info
app.get('/', (req, res) => {
  res.json({ message: 'KeyZen Backend API is running', status: 'healthy', docs: '/api/health' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Diagnostic check for SMTP / Email config on Render
app.get('/api/test-smtp', (req, res) => {
  const nodemailer = require('nodemailer');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const hasBrevo = !!process.env.BREVO_API_KEY;
  const hasResend = !!process.env.RESEND_API_KEY;

  if (!user || !pass) {
    return res.json({
      configured: false,
      hasBrevo,
      hasResend,
      error: 'EMAIL_USER or EMAIL_PASS environment variable is missing on Render.',
      envKeysPresent: Object.keys(process.env).filter(k => k.includes('EMAIL') || k.includes('RESEND') || k.includes('BREVO')),
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 7000,
  });

  transporter.verify((err, success) => {
    if (err) {
      return res.json({
        configured: true,
        hasBrevo,
        hasResend,
        smtpSuccess: false,
        error: err.message,
        code: err.code,
      });
    }
    res.json({ configured: true, hasBrevo, hasResend, smtpSuccess: true });
  });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`KeyZen server running on port ${PORT}`);
  });
});
