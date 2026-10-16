import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { useToast } from '../context/ToastContext';
import { analyzeVault } from '../utils/passwordUtils';
import VaultItemModal from '../components/VaultItemModal';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Edit3,
} from 'lucide-react';

function PasswordHealth() {
  const { items, loading, error, fetchItems, updateItem } = useVault();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('issues');
  const [search, setSearch] = useState('');
  const [showExplainer, setShowExplainer] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchItems();
      showToast('Vault audit refreshed', 'success');
    } catch {
      showToast('Failed to refresh audit', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveModal = async (data) => {
    if (modalItem) {
      await updateItem(modalItem._id, data);
      showToast('Password updated successfully', 'success');
    }
    setModalItem(null);
  };

  // Perform client-side security audit scoped strictly to this user's decrypted items
  const audit = analyzeVault(items);
  const { score, total, strong, weak, reused, old, breakdown } = audit;

  // SVG circle gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'var(--success)';
    if (score >= 65) return 'var(--accent)';
    if (score >= 45) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreTier = () => {
    if (score >= 80) return { label: 'Excellent Security', class: 'green', desc: 'Your vault is highly secure against brute-force and credential stuffing attacks.' };
    if (score >= 65) return { label: 'Good Protection', class: 'blue', desc: 'Solid security posture, but a few credentials could use stronger entropy or rotation.' };
    if (score >= 45) return { label: 'Needs Attention', class: 'yellow', desc: 'Action required: Some credentials are weak or reused across multiple services.' };
    return { label: 'Critical Risk', class: 'red', desc: 'High vulnerability: Weak or heavily reused passwords put your accounts at risk.' };
  };

  const tier = getScoreTier();

  // Determine items for the selected category
  let categoryItems = [];
  if (activeCategory === 'issues') categoryItems = audit.allIssues;
  else if (activeCategory === 'weak') categoryItems = audit.weakItems;
  else if (activeCategory === 'reused') categoryItems = audit.reusedItems;
  else if (activeCategory === 'strong') categoryItems = audit.strongItems;
  else if (activeCategory === 'old') categoryItems = audit.oldItems;

  // Apply search filter within category
  const filteredItems = categoryItems.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.username && item.username.toLowerCase().includes(q)) ||
      (item.url && item.url.toLowerCase().includes(q))
    );
  });

  // --- Loading State ---
  if (loading && items.length === 0) {
    return (
      <div className="health-page">
        <div className="audit-loading-card">
          <RefreshCw className="audit-spinner" size={36} />
          <h3>Auditing Vault Security</h3>
          <p>Analyzing password entropy, detecting credential reuse, and calculating protection score...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error && items.length === 0) {
    return (
      <div className="health-page">
        <div className="audit-error-card">
          <AlertTriangle size={48} className="text-danger" />
          <h3>Security Audit Unavailable</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary" style={{ marginTop: '16px' }}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="health-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="audit-header-badge">
            <Sparkles size={14} /> Smart Security Audit
          </div>
          <h1>Password Health & Security Audit</h1>
          <p>Real-time vulnerability detection, entropy analysis, and credential reuse auditing.</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleRefresh}
            className={`btn btn-secondary ${isRefreshing ? 'refreshing' : ''}`}
            disabled={isRefreshing}
            title="Re-run audit"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
            {isRefreshing ? 'Auditing…' : 'Re-scan Vault'}
          </button>
          <Link to="/dashboard/vault" className="btn btn-primary">
            Go to Vault
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {total === 0 ? (
        <div className="empty-state">
          <Shield size={48} />
          <h3>No Passwords in Vault</h3>
          <p>Add credentials to your vault to activate the Smart Security Audit and view vulnerability scores.</p>
          <Link to="/dashboard/vault" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Add Your First Password
          </Link>
        </div>
      ) : (
        <>
          {/* Security Score Hero Overview */}
          <div className="health-overview audit-hero-card">
            <div className="score-ring">
              <svg viewBox="0 0 130 130">
                <circle
                  className="score-ring-bg"
                  cx="65"
                  cy="65"
                  r={radius}
                />
                <circle
                  className="score-ring-fill"
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={getScoreColor()}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              <div className="score-value">
                <strong>{score}</strong>
                <span>/ 100</span>
              </div>
            </div>

            <div className="health-summary">
              <div className="audit-tier-badge-row">
                <span className={`audit-tier-badge ${tier.class}`}>
                  {score >= 80 ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {tier.label}
                </span>
                <span className="audit-timestamp text-xs text-muted">
                  Audited {total} credential{total === 1 ? '' : 's'}
                </span>
              </div>
              <h2>Overall Vault Security Score</h2>
              <p>{tier.desc}</p>

              <button
                type="button"
                className="audit-calc-toggle"
                onClick={() => setShowExplainer(!showExplainer)}
              >
                <Info size={14} />
                <span>How is this score calculated?</span>
                {showExplainer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Expandable Score Calculation Breakdown */}
          {showExplainer && (
            <div className="audit-breakdown-card">
              <div className="audit-breakdown-header">
                <div>
                  <h4>Transparent Security Score Formula</h4>
                  <p className="text-xs text-muted">
                    Your score is a weighted composite of three critical security dimensions (0–100 pts):
                  </p>
                </div>
              </div>

              <div className="audit-formula-grid">
                {/* Component 1: Password Strength */}
                <div className="audit-formula-item">
                  <div className="audit-formula-top">
                    <span className="formula-label">
                      <strong>1. Average Strength</strong> (45% weight)
                    </span>
                    <span className="formula-pts">
                      {breakdown.strengthPoints} / 45 pts
                    </span>
                  </div>
                  <div className="formula-bar">
                    <div
                      className="formula-bar-fill"
                      style={{
                        width: `${(breakdown.strengthPoints / 45) * 100}%`,
                        background: breakdown.avgStrengthScore >= 70 ? 'var(--success)' : 'var(--warning)',
                      }}
                    />
                  </div>
                  <p className="formula-caption text-xs">
                    Average entropy score across your vault is <strong>{breakdown.avgStrengthScore}/100</strong>.
                  </p>
                </div>

                {/* Component 2: Credential Uniqueness */}
                <div className="audit-formula-item">
                  <div className="audit-formula-top">
                    <span className="formula-label">
                      <strong>2. Password Uniqueness</strong> (40% weight)
                    </span>
                    <span className="formula-pts">
                      {breakdown.uniquenessPoints} / 40 pts
                    </span>
                  </div>
                  <div className="formula-bar">
                    <div
                      className="formula-bar-fill"
                      style={{
                        width: `${(breakdown.uniquenessPoints / 40) * 100}%`,
                        background: reused === 0 ? 'var(--success)' : 'var(--danger)',
                      }}
                    />
                  </div>
                  <p className="formula-caption text-xs">
                    {reused === 0
                      ? '✓ 100% unique passwords. Complete protection against credential stuffing.'
                      : `⚠ ${reused} item${reused === 1 ? '' : 's'} share passwords. Reusing passwords across accounts is a primary security vulnerability.`}
                  </p>
                </div>

                {/* Component 3: Vault Freshness */}
                <div className="audit-formula-item">
                  <div className="audit-formula-top">
                    <span className="formula-label">
                      <strong>3. Vault Freshness</strong> (15% weight)
                    </span>
                    <span className="formula-pts">
                      {breakdown.freshnessPoints} / 15 pts
                    </span>
                  </div>
                  <div className="formula-bar">
                    <div
                      className="formula-bar-fill"
                      style={{
                        width: `${(breakdown.freshnessPoints / 15) * 100}%`,
                        background: old === 0 ? 'var(--success)' : 'var(--accent)',
                      }}
                    />
                  </div>
                  <p className="formula-caption text-xs">
                    {old === 0
                      ? '✓ All passwords updated within the past 90 days.'
                      : `${old} password${old === 1 ? '' : 's'} have not been rotated in 90+ days.`}
                  </p>
                </div>
              </div>

              <div className="audit-formula-math text-xs">
                <strong>Calculation:</strong> Overall Score = ({breakdown.strengthPoints} Strength) + ({breakdown.uniquenessPoints} Uniqueness) + ({breakdown.freshnessPoints} Freshness) = <strong>{score}/100</strong>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="health-stats">
            <div
              className={`health-stat ${activeCategory === 'issues' ? 'active-stat' : ''}`}
              onClick={() => setActiveCategory('issues')}
              style={{ cursor: 'pointer' }}
              title="View all credentials with issues"
            >
              <h3>{audit.allIssues.length}</h3>
              <p>Needs Attention</p>
            </div>
            <div
              className={`health-stat red ${activeCategory === 'weak' ? 'active-stat' : ''}`}
              onClick={() => setActiveCategory('weak')}
              style={{ cursor: 'pointer' }}
              title="Filter weak passwords"
            >
              <h3>{weak}</h3>
              <p>Weak / Fair</p>
            </div>
            <div
              className={`health-stat yellow ${activeCategory === 'reused' ? 'active-stat' : ''}`}
              onClick={() => setActiveCategory('reused')}
              style={{ cursor: 'pointer' }}
              title="Filter reused passwords"
            >
              <h3>{reused}</h3>
              <p>Reused Across Accounts</p>
            </div>
            <div
              className={`health-stat green ${activeCategory === 'strong' ? 'active-stat' : ''}`}
              onClick={() => setActiveCategory('strong')}
              style={{ cursor: 'pointer' }}
              title="Filter strong passwords"
            >
              <h3>{strong}</h3>
              <p>Strong & Secure</p>
            </div>
            <div
              className={`health-stat blue ${activeCategory === 'old' ? 'active-stat' : ''}`}
              onClick={() => setActiveCategory('old')}
              style={{ cursor: 'pointer' }}
              title="Filter passwords older than 90 days"
            >
              <h3>{old}</h3>
              <p>Old (90+ Days)</p>
            </div>
          </div>

          {/* Actionable Category Navigation Tabs */}
          <div className="audit-controls-row">
            <div className="audit-tabs">
              <button
                type="button"
                className={`audit-tab ${activeCategory === 'issues' ? 'active' : ''}`}
                onClick={() => setActiveCategory('issues')}
              >
                <AlertTriangle size={15} />
                <span>All Issues</span>
                <span className="audit-tab-count">{audit.allIssues.length}</span>
              </button>

              <button
                type="button"
                className={`audit-tab ${activeCategory === 'weak' ? 'active' : ''}`}
                onClick={() => setActiveCategory('weak')}
              >
                <span className="dot dot-red" />
                <span>Weak Passwords</span>
                <span className="audit-tab-count">{weak}</span>
              </button>

              <button
                type="button"
                className={`audit-tab ${activeCategory === 'reused' ? 'active' : ''}`}
                onClick={() => setActiveCategory('reused')}
              >
                <span className="dot dot-yellow" />
                <span>Reused Passwords</span>
                <span className="audit-tab-count">{reused}</span>
              </button>

              <button
                type="button"
                className={`audit-tab ${activeCategory === 'strong' ? 'active' : ''}`}
                onClick={() => setActiveCategory('strong')}
              >
                <CheckCircle2 size={15} className="text-success" />
                <span>Strong Passwords</span>
                <span className="audit-tab-count">{strong}</span>
              </button>

              <button
                type="button"
                className={`audit-tab ${activeCategory === 'old' ? 'active' : ''}`}
                onClick={() => setActiveCategory('old')}
              >
                <Clock size={15} />
                <span>Old (90+ Days)</span>
                <span className="audit-tab-count">{old}</span>
              </button>
            </div>

            {/* In-category Search Input */}
            <div className="audit-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search audited items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Items List */}
          <div className="audit-items-section">
            <div className="audit-items-header">
              <h3>
                {activeCategory === 'issues' && 'Passwords Requiring Remediation'}
                {activeCategory === 'weak' && 'Weak & Vulnerable Passwords'}
                {activeCategory === 'reused' && 'Credential Reuse Detected'}
                {activeCategory === 'strong' && 'Secure & High-Entropy Credentials'}
                {activeCategory === 'old' && 'Stale Credentials (90+ Days Old)'}
              </h3>
              <span className="text-xs text-muted">
                Showing {filteredItems.length} of {categoryItems.length} item{categoryItems.length === 1 ? '' : 's'}
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="audit-empty-category">
                {search ? (
                  <>
                    <Search size={32} className="text-muted" />
                    <p>No credentials matching &quot;{search}&quot; in this category.</p>
                  </>
                ) : activeCategory === 'weak' ? (
                  <>
                    <CheckCircle2 size={36} className="text-success" />
                    <h4>Zero Weak Passwords!</h4>
                    <p>All passwords in your vault meet or exceed the recommended strength threshold.</p>
                  </>
                ) : activeCategory === 'reused' ? (
                  <>
                    <CheckCircle2 size={36} className="text-success" />
                    <h4>Zero Password Reuse!</h4>
                    <p>Every account in your vault uses a distinct, unique password. Excellent job!</p>
                  </>
                ) : activeCategory === 'issues' ? (
                  <>
                    <CheckCircle2 size={36} className="text-success" />
                    <h4>No Security Issues Found!</h4>
                    <p>All passwords in your vault are strong, unique, and up to date.</p>
                  </>
                ) : (
                  <>
                    <Info size={32} className="text-muted" />
                    <p>No credentials in this category.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="audit-cards-grid">
                {filteredItems.map((item) => (
                  <div key={item._id} className="audit-item-card">
                    <div className="audit-item-main">
                      {/* Avatar icon */}
                      <div className="vault-item-icon">
                        {item.title.charAt(0).toUpperCase()}
                      </div>

                      <div className="audit-item-info">
                        <div className="audit-item-title-row">
                          <h4>{item.title}</h4>
                          {item.url && (
                            <span className="audit-item-url text-xs text-muted">
                              {item.url.replace(/^https?:\/\//i, '').split('/')[0]}
                            </span>
                          )}
                        </div>

                        {item.username && (
                          <div className="audit-item-user text-xs text-secondary">
                            {item.username}
                          </div>
                        )}

                        {/* Badges */}
                        <div className="attention-tags" style={{ marginTop: '6px' }}>
                          <span
                            className={`attention-tag ${
                              item.strength.level <= 1
                                ? 'weak'
                                : item.strength.level === 2
                                ? 'weak'
                                : 'strong-tag'
                            }`}
                          >
                            Strength: {item.strength.label} ({item.strength.score}/100)
                          </span>

                          {item.isReused && (
                            <span className="attention-tag reused">
                              Reused across {item.reusedCount} accounts
                            </span>
                          )}

                          {item.isOld && (
                            <span className="attention-tag old">
                              Updated 90+ days ago
                            </span>
                          )}
                        </div>

                        {/* Reused With Sibling Accounts */}
                        {item.isReused && item.reusedWith.length > 0 && (
                          <div className="audit-reused-with-box">
                            <span className="text-xs text-muted">Shared secret with:</span>
                            <div className="audit-sibling-chips">
                              {item.reusedWith.map((sibling) => (
                                <Link
                                  key={sibling._id}
                                  to={`/dashboard/vault?edit=${sibling._id}`}
                                  className="audit-sibling-chip"
                                  title={`Open ${sibling.title} to update password`}
                                >
                                  {sibling.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vulnerability & Strength Feedback Points */}
                        {item.strength.feedback && item.strength.feedback.length > 0 && (
                          <ul className="audit-feedback-list">
                            {item.strength.feedback.map((fb, idx) => (
                              <li
                                key={idx}
                                className={
                                  item.strength.level >= 3 ? 'feedback-positive' : 'feedback-negative'
                                }
                              >
                                {fb}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="audit-item-actions">
                      {/* In-place Quick Fix Modal Button */}
                      <button
                        type="button"
                        onClick={() => setModalItem(item)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '7px 12px' }}
                        title="Update password immediately in a popup"
                      >
                        <Edit3 size={14} /> Quick Fix
                      </button>

                      {/* Direct navigation to Vault page with ?edit=itemId */}
                      <Link
                        to={`/dashboard/vault?edit=${item._id}`}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8125rem', padding: '7px 12px' }}
                        title="Open in Vault to edit full credential details"
                      >
                        <span>Vault Details</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* In-place Quick Fix Modal */}
      {modalItem && (
        <VaultItemModal
          item={modalItem}
          onSave={handleSaveModal}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  );
}

export default PasswordHealth;
