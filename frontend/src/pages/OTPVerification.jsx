import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { KeyRound, ShieldCheck, Mail, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import api from '../services/api';

function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);
  const { verifyOTP } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { tempToken, email } = location.state || {};

  // Redirect if no temp token
  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  // OTP expiry countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : '***';

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5) {
      const code = newOtp.join('');
      if (code.length === 6) {
        handleVerify(code);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear current and focus previous
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Arrow keys navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    if (countdown <= 0) {
      setError('Verification code has expired. Please request a new one.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyOTP(tempToken, code);
      showToast('Login successful! Welcome back.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    handleVerify(code);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { tempToken });
      showToast(res.data.message || 'New verification code sent!', 'success');
      setCountdown(300);
      setResendCooldown(30); // 30 seconds before next resend
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (!tempToken) return null;

  return (
    <div className="auth-page">
      <div className="auth-card otp-card">
        <div className="auth-header">
          <Link to="/" className="logo">
            <KeyRound size={22} />
            <span>KeyZen</span>
          </Link>

          {/* Shield animation */}
          <div className="otp-shield-icon">
            <div className="otp-shield-pulse"></div>
            <ShieldCheck size={40} />
          </div>

          <h1>Verify Your Identity</h1>
          <p>We sent a 6-digit verification code to</p>
          <div className="otp-email-badge">
            <Mail size={14} />
            <span>{maskedEmail}</span>
          </div>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        {/* Timer */}
        <div className={`otp-timer ${countdown <= 60 ? 'expiring' : ''}`}>
          <Clock size={14} />
          <span>
            {countdown > 0
              ? `Code expires in ${formatTime(countdown)}`
              : 'Code has expired'}
          </span>
        </div>



        <form className="auth-form" onSubmit={handleSubmit}>
          {/* OTP Input Boxes */}
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-digit ${digit ? 'filled' : ''}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || otp.join('').length !== 6 || countdown <= 0}
          >
            {loading ? (
              <>
                <span className="otp-spinner"></span>
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Verify & Sign In
              </>
            )}
          </button>
        </form>

        {/* Resend & Back */}
        <div className="otp-actions">
          <button
            className="btn btn-ghost otp-resend-btn"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
          >
            <RefreshCw size={14} className={resending ? 'spinning' : ''} />
            {resending
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Code'}
          </button>

          <Link to="/login" className="btn btn-ghost">
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>

        <p className="otp-security-note">
          🔒 This is a one-time code for enhanced security. Never share it with anyone.
        </p>
      </div>
    </div>
  );
}

export default OTPVerification;
