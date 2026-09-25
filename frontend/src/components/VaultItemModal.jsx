import { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { generatePassword, getPasswordStrength } from '../utils/passwordUtils';

function VaultItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    url: '',
    username: '',
    password: '',
    notes: '',
    favorite: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        url: item.url || '',
        username: item.username || '',
        password: item.password || '',
        notes: item.notes || '',
        favorite: item.favorite || false,
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerate = () => {
    const pw = generatePassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    setForm((prev) => ({ ...prev, password: pw }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.password.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Password' : 'Add Password'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Website / App Name *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g. Google, Netflix"
                value={form.title}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                type="text"
                name="url"
                className="form-input"
                placeholder="e.g. https://google.com"
                value={form.url}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username / Email</label>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="e.g. john@example.com"
                value={form.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn-icon input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="strength-bar">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`strength-segment ${
                          i <= strength.level ? 'active' : ''
                        } ${
                          strength.level === 1
                            ? ''
                            : strength.level === 2
                            ? 'fair'
                            : strength.level === 3
                            ? 'good'
                            : 'strong'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="strength-text" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleGenerate}
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
              >
                <RefreshCw size={14} />
                Generate Password
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                className="form-input"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="favorite"
                checked={form.favorite}
                onChange={handleChange}
              />
              Mark as favorite
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !form.title.trim() || !form.password.trim()}
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VaultItemModal;
