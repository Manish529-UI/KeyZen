import { Link } from 'react-router-dom';
import {
  KeyRound,
  FolderLock,
  Wand2,
  Shield,
  Search,
  Lock,
  Fingerprint,
  Timer,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

function Landing() {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <Link to="/" className="logo">
          <KeyRound size={22} />
          <span>KeyZen</span>
        </Link>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Your passwords.
            <br />
            Your <span>control</span>.
          </h1>
          <p>
            KeyZen helps you securely organize, manage and access your passwords
            from one place. Simple, safe, and always within reach.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        </div>

        {/* Vault visual mockup */}
        <div className="vault-visual">
          <div className="vault-visual-header">
            <div className="vault-visual-dot" />
            <div className="vault-visual-dot" />
            <div className="vault-visual-dot" />
          </div>
          <div className="vault-visual-search">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <div className="vault-visual-search-bar" />
          </div>
          <div className="vault-visual-row highlighted">
            <div className="vault-visual-icon">G</div>
            <div className="vault-visual-info">
              <div className="vault-visual-title" style={{ width: 72 }} />
              <div className="vault-visual-sub" style={{ width: 130 }} />
            </div>
            <div className="vault-visual-dots">••••••</div>
          </div>
          <div className="vault-visual-row">
            <div className="vault-visual-icon" style={{ color: 'var(--success)' }}>
              N
            </div>
            <div className="vault-visual-info">
              <div className="vault-visual-title" style={{ width: 84 }} />
              <div className="vault-visual-sub" style={{ width: 110 }} />
            </div>
            <div className="vault-visual-dots">••••••</div>
          </div>
          <div className="vault-visual-row">
            <div className="vault-visual-icon" style={{ color: 'var(--warning)' }}>
              S
            </div>
            <div className="vault-visual-info">
              <div className="vault-visual-title" style={{ width: 64 }} />
              <div className="vault-visual-sub" style={{ width: 140 }} />
            </div>
            <div className="vault-visual-dots">••••••</div>
          </div>
          <div className="vault-visual-row">
            <div className="vault-visual-icon">D</div>
            <div className="vault-visual-info">
              <div className="vault-visual-title" style={{ width: 90 }} />
              <div className="vault-visual-sub" style={{ width: 100 }} />
            </div>
            <div className="vault-visual-dots">••••••</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <p className="section-label">Features</p>
        <h2 className="section-title">Everything you need to stay secure</h2>
        <p className="section-desc">
          KeyZen gives you the essential tools to manage your passwords
          efficiently, without the complexity.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FolderLock size={22} />
            </div>
            <h3>Secure Vault</h3>
            <p>
              Store all your passwords in one encrypted vault. Access them
              anytime with your master password.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Wand2 size={22} />
            </div>
            <h3>Password Generator</h3>
            <p>
              Create strong, unique passwords with customizable length and
              character options.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={22} />
            </div>
            <h3>Password Health</h3>
            <p>
              Get a security score and identify weak, reused, or outdated
              passwords in your vault.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Search size={22} />
            </div>
            <h3>Quick Search</h3>
            <p>
              Find any password instantly. Search by name, username, or website
              across your entire vault.
            </p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="security-section" id="security">
        <p className="section-label">Security</p>
        <h2 className="section-title">How we keep your data safe</h2>
        <p className="section-desc">
          KeyZen uses industry-standard security practices to protect your
          stored credentials.
        </p>

        <div className="security-grid">
          <div className="security-card">
            <div className="security-card-icon green">
              <Lock size={20} />
            </div>
            <div>
              <h3>Encrypted Storage</h3>
              <p>
                Your vault passwords are encrypted using AES-256 before being
                stored. They are never saved as plain text in the database.
              </p>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-icon blue">
              <Fingerprint size={20} />
            </div>
            <div>
              <h3>Hashed Authentication</h3>
              <p>
                Your master password is hashed with bcrypt before storage. Even
                we cannot see your actual password.
              </p>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-icon green">
              <Shield size={20} />
            </div>
            <div>
              <h3>Token-Based Access</h3>
              <p>
                API requests are authenticated using JWT tokens. Unauthorized
                access to your vault data is prevented.
              </p>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-icon blue">
              <Timer size={20} />
            </div>
            <div>
              <h3>Auto-Lock</h3>
              <p>
                Set an inactivity timer to automatically lock your vault session
                when you step away from your device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <KeyRound size={20} />
              <span>KeyZen</span>
            </div>
            <p>
              A secure, open-source password manager built with the MERN stack.
              Your passwords, your control.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#security">Security</a>
            </div>
            <div className="footer-col">
              <h4>Links</h4>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="#security">Privacy</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} KeyZen. Built as a MERN stack project.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
