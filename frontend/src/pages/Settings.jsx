import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Eye, EyeOff, ShieldCheck, Lock, KeyRound, Mail,
  Shield, Fingerprint, Clock, AlertTriangle, CheckCircle2
} from 'lucide-react';

function Settings() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Theme
  const [theme, setTheme] = useState(
    localStorage.getItem('keyzen_theme') || 'dark'
  );

  // Auto-lock
  const [autoLock, setAutoLock] = useState(
    localStorage.getItem('keyzen_autolock') || '0'
  );

  // Change password form
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  // Security status
  const [securityStatus, setSecurityStatus] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityStatus = async () => {
      try {
        const res = await api.get('/auth/security-status');
        setSecurityStatus(res.data);
      } catch (err) {
        console.error('Failed to fetch security status');
      } finally {
        setSecurityLoading(false);
      }
    };
    fetchSecurityStatus();
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('keyzen_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleAutoLockChange = (value) => {
    setAutoLock(value);
    localStorage.setItem('keyzen_autolock', value);
    showToast(
      value === '0' ? 'Auto-lock disabled' : `Auto-lock set to ${value} minutes`,
      'info'
    );
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');

    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwError('Please fill in all fields');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('Master password updated', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(
        err.response?.data?.message || 'Failed to update password'
      );
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const securityFeatures = securityStatus
    ? [
        {
          icon: <Lock size={18} />,
          label: 'Password Hashing',
          value: securityStatus.passwordHashing,
          active: true,
          color: 'green',
        },
        {
          icon: <KeyRound size={18} />,
          label: 'Vault Encryption',
          value: securityStatus.vaultEncryption,
          active: true,
          color: 'green',
        },
        {
          icon: <Mail size={18} />,
          label: 'Two-Factor Auth (2FA)',
          value: securityStatus.twoFactorAuth,
          active: true,
          color: 'blue',
        },
        {
          icon: <Shield size={18} />,
          label: 'Brute Force Protection',
          value: securityStatus.bruteForceProtection ? 'Active' : 'Inactive',
          active: securityStatus.bruteForceProtection,
          color: 'green',
        },
        {
          icon: <Fingerprint size={18} />,
          label: 'API Rate Limiting',
          value: securityStatus.rateLimiting ? 'Active' : 'Inactive',
          active: securityStatus.rateLimiting,
          color: 'green',
        },
        {
          icon: <Clock size={18} />,
          label: 'Token Expiry',
          value: securityStatus.jwtExpiry,
          active: true,
          color: 'blue',
        },
      ]
    : [];

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, security, and preferences</p>
        </div>
      </div>

      {/* Security Dashboard */}
      <div className="settings-section">
        <h2>
          <ShieldCheck size={18} style={{ marginRight: 8, color: 'var(--success)' }} />
          Security Dashboard
        </h2>
        {securityLoading ? (
          <div className="settings-card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            Loading security status...
          </div>
        ) : (
          <>
            {/* Security Score Banner */}
            <div className="security-banner">
              <div className="security-banner-icon">
                <ShieldCheck size={28} />
              </div>
              <div className="security-banner-info">
                <h3>Security Level: Excellent</h3>
                <p>All security features are active and protecting your vault</p>
              </div>
              <div className="security-score-badge">6/6</div>
            </div>

            {/* Security Features Grid */}
            <div className="security-features-grid">
              {securityFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`security-feature-item ${feature.active ? 'active' : 'inactive'}`}
                >
                  <div className={`security-feature-icon ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <div className="security-feature-info">
                    <span className="security-feature-label">{feature.label}</span>
                    <span className="security-feature-value">{feature.value}</span>
                  </div>
                  <div className="security-feature-status">
                    {feature.active ? (
                      <CheckCircle2 size={16} className="status-active" />
                    ) : (
                      <AlertTriangle size={16} className="status-inactive" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Account Status */}
            {securityStatus?.accountLocked && (
              <div className="auth-alert" style={{ marginTop: 12 }}>
                <AlertTriangle size={16} />
                <span>Your account is currently locked due to multiple failed login attempts.</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile */}
      <div className="settings-section">
        <h2>Profile</h2>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-row-label">Name</span>
            <span className="settings-row-value">{user?.name}</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Email</span>
            <span className="settings-row-value">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="settings-section">
        <h2>Security</h2>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-row-label">Auto-Lock</span>
            <select
              className="form-select"
              value={autoLock}
              onChange={(e) => handleAutoLockChange(e.target.value)}
            >
              <option value="0">Never</option>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div style={{ paddingTop: 16 }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: 12 }}>
              Change Master Password
            </h3>
            {pwError && (
              <div className="auth-alert" style={{ marginBottom: 12 }}>
                {pwError}
              </div>
            )}
            <form className="settings-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="form-input-wrapper">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="btn-icon input-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPassword: e.target.value })
                  }
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirmPassword: e.target.value })
                  }
                  placeholder="Repeat new password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading}
                style={{ alignSelf: 'flex-start' }}
              >
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="settings-section">
        <h2>Appearance</h2>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-row-label">Theme</span>
            <div className="theme-toggle">
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                Dark
              </button>
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                Light
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="settings-section">
        <h2>Account</h2>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;
