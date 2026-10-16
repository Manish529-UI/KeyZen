const nodemailer = require('nodemailer');

// Check if real email credentials are configured
const isEmailConfigured = () => {
  if (process.env.RESEND_API_KEY) return true;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return user && pass && !user.includes('your_email') && !pass.includes('your_gmail');
};

let transporter = null;

const getTransporter = () => {
  if (!transporter && isEmailConfigured()) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 4000, // 4s timeout prevents hanging on Render free tier
      greetingTimeout: 4000,
      socketTimeout: 5000,
    });
  }
  return transporter;
};

/**
 * Send OTP verification email with a professional HTML template.
 * If email is not configured, logs OTP to console for development/testing.
 * @param {string} to - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 * @param {string} name - User's name for personalization
 * @returns {{ sent: boolean, devMode: boolean, otp?: string }}
 */
const sendOTPEmail = async (to, otp, name) => {
  // Dev mode: email not configured — log OTP to console
  if (!isEmailConfigured()) {
    console.log('\n========================================');
    console.log('  📧 EMAIL NOT CONFIGURED — DEV MODE');
    console.log(`  OTP for ${to}: ${otp}`);
    console.log('========================================\n');
    return { sent: true, devMode: true, otp };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `KeyZen Security <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 KeyZen - Your Login Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#0f1923;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:#1a2332;border:1px solid #2d4059;border-radius:12px;overflow:hidden;">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1e3a5f,#0f1923);padding:32px 24px;text-align:center;border-bottom:1px solid #2d4059;">
            <div style="font-size:24px;font-weight:700;color:#f1f5f9;margin-bottom:4px;">
              🔑 KeyZen
            </div>
            <div style="font-size:13px;color:#94a3b8;">Secure Password Manager</div>
          </div>
          
          <!-- Body -->
          <div style="padding:32px 24px;">
            <p style="color:#f1f5f9;font-size:16px;margin:0 0 8px;">
              Hello, <strong>${name}</strong>
            </p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
              We received a login request for your KeyZen vault. Use the verification code below to complete your sign-in:
            </p>
            
            <!-- OTP Code Box -->
            <div style="background:#0f1923;border:2px solid #3b82f6;border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
              <div style="font-size:36px;font-weight:700;color:#3b82f6;letter-spacing:12px;font-family:'Courier New',monospace;">
                ${otp}
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:8px;">
                Valid for 5 minutes
              </div>
            </div>
            
            <!-- Warning -->
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px 16px;margin:0 0 20px;">
              <p style="color:#ef4444;font-size:13px;margin:0;line-height:1.5;">
                ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. KeyZen will never ask for your OTP via phone or chat.
              </p>
            </div>
            
            <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
              If you did not attempt to log in, please change your master password immediately and secure your account.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="border-top:1px solid #2d4059;padding:20px 24px;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} KeyZen — Encrypted & Secure
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // 1. Try Resend HTTPS API if API Key is configured (100% works on Render Free Tier via port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('@gmail.com'))
            ? process.env.EMAIL_FROM
            : 'KeyZen Security <onboarding@resend.dev>',
          to: [to],
          subject: '🔐 KeyZen - Your Login Verification Code',
          html: mailOptions.html,
        }),
      });

      if (resendRes.ok) {
        console.log(`[Resend API] OTP email successfully delivered to ${to}`);
        return { sent: true };
      } else {
        const errorData = await resendRes.json().catch(() => ({}));
        console.warn('[Resend API] Delivery issue:', errorData);
      }
    } catch (apiErr) {
      console.warn('[Resend API] Request failed:', apiErr.message);
    }
  }

  // 2. Fallback to Nodemailer SMTP (Gmail)
  try {
    const activeTransporter = getTransporter();
    if (!activeTransporter) throw new Error('Email credentials are not configured');
    await activeTransporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
    return { sent: true };
  } catch (error) {
    console.warn(`[KeyZen Auth] Email send failed (${error.message}). Notice: Render Free Tier blocks outbound SMTP ports 465/587.`);
    console.log('\n========================================');
    console.log(`  🔐 KEYZEN OTP FOR ${to}: ${otp}`);
    console.log('========================================\n');
    return { sent: false, devMode: true, otp, error: error.message };
  }
};

module.exports = { sendOTPEmail };
