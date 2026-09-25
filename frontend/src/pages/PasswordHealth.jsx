import { useVault } from '../context/VaultContext';
import { analyzeVault } from '../utils/passwordUtils';
import { Shield, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

function PasswordHealth() {
  const { items, loading } = useVault();

  if (loading) return <div className="page-loading">Analyzing vault...</div>;

  const { score, strong, weak, reused, old, needsAttention } =
    analyzeVault(items);

  // SVG circle math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="health-page">
      <div className="page-header">
        <div>
          <h1>Password Health</h1>
          <p>Security overview of your vault</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Shield size={48} />
          <h3>No passwords to analyze</h3>
          <p>Add some passwords to your vault to see your security score.</p>
          <Link to="/dashboard/vault" className="btn btn-primary">
            Go to Vault
          </Link>
        </div>
      ) : (
        <>
          <div className="health-overview">
            <div className="score-ring">
              <svg viewBox="0 0 120 120">
                <circle
                  className="score-ring-bg"
                  cx="60"
                  cy="60"
                  r={radius}
                />
                <circle
                  className="score-ring-fill"
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke={getScoreColor()}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="score-value">
                <strong>{score}</strong>
                <span>/ 100</span>
              </div>
            </div>
            <div className="health-summary">
              <h2>Security Score</h2>
              <p>
                {score >= 80
                  ? 'Your vault is in good shape. Keep it up!'
                  : score >= 50
                  ? 'Your vault needs some attention. Consider updating weak passwords.'
                  : 'Your vault needs improvement. Update weak and reused passwords.'}
              </p>
            </div>
          </div>

          <div className="health-stats">
            <div className="health-stat green">
              <h3>{strong}</h3>
              <p>Strong</p>
            </div>
            <div className="health-stat red">
              <h3>{weak}</h3>
              <p>Weak</p>
            </div>
            <div className="health-stat yellow">
              <h3>{reused}</h3>
              <p>Reused</p>
            </div>
            <div className="health-stat blue">
              <h3>{old}</h3>
              <p>Old (90+ days)</p>
            </div>
          </div>

          {needsAttention.length > 0 && (
            <div className="attention-section">
              <h2>Passwords that need attention</h2>
              {needsAttention.map((item) => (
                <div key={item._id} className="attention-item">
                  <div className="vault-item-icon">
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="attention-item-info">
                    <h4>{item.title}</h4>
                    <div className="attention-tags">
                      {item.issues.map((issue) => (
                        <span
                          key={issue}
                          className={`attention-tag ${
                            issue === 'Weak' || issue === 'Fair'
                              ? 'weak'
                              : issue === 'Reused'
                              ? 'reused'
                              : 'old'
                          }`}
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    to="/dashboard/vault"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    Update
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PasswordHealth;
