import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { KeyRound, Eye, EyeOff, Shield } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);

      // If OTP is required, redirect to verification page
      if (response.requireOTP) {
        showToast(response.message || 'Verification code sent!', 'info');
        navigate('/verify-otp', {
          state: {
            tempToken: response.tempToken,
            email: response.email,
          },
        });
      } else {
        // Direct login (fallback if OTP is disabled)
        showToast('Welcome back!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);

      // Show remaining attempts warning
      if (err.response?.data?.attemptsLeft !== undefined) {
        const attempts = err.response.data.attemptsLeft;
        if (attempts > 0 && attempts <= 2) {
          showToast(`Warning: ${attempts} attempt(s) remaining before account lock`, 'error');
        }
      }

      // Show lock message
      if (err.response?.status === 423) {
        showToast('Account temporarily locked', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="logo">
            <KeyRound size={22} />
            <span>KeyZen</span>
          </Link>
          <h1>Welcome back</h1>
          <p>Enter your credentials to access your vault</p>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Master Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn-icon input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="login-security-badge">
            <Shield size={13} />
            <span>Protected with Email OTP Verification</span>
          </div>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
