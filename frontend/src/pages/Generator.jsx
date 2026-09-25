import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { generatePassword, getPasswordStrength } from '../utils/passwordUtils';
import { RefreshCw, Copy } from 'lucide-react';

function Generator() {
  const { showToast } = useToast();

  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState(() =>
    generatePassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    })
  );

  const handleGenerate = () => {
    setPassword(generatePassword(length, options));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      showToast('Password copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleLengthChange = (val) => {
    const num = Math.min(64, Math.max(4, parseInt(val) || 4));
    setLength(num);
  };

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="generator-page">
      <div className="page-header">
        <div>
          <h1>Password Generator</h1>
          <p>Create strong, unique passwords</p>
        </div>
      </div>

      {/* Generated password output */}
      <div className="generator-output">
        <code>{password}</code>
        <button className="btn-icon" onClick={handleCopy} title="Copy">
          <Copy size={18} />
        </button>
        <button className="btn-icon" onClick={handleGenerate} title="Regenerate">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Strength indicator */}
      <div style={{ marginBottom: 24 }}>
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
      </div>

      {/* Controls */}
      <div className="generator-controls">
        <div className="slider-group">
          <div className="slider-header">
            <label>Password Length</label>
            <input
              type="number"
              min={4}
              max={64}
              value={length}
              onChange={(e) => handleLengthChange(e.target.value)}
            />
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
          />
        </div>

        <div className="toggle-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => toggleOption('uppercase')}
            />
            Uppercase (A-Z)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => toggleOption('lowercase')}
            />
            Lowercase (a-z)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => toggleOption('numbers')}
            />
            Numbers (0-9)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => toggleOption('symbols')}
            />
            Symbols (!@#$)
          </label>
        </div>
      </div>

      <div className="generator-actions">
        <button className="btn btn-primary" onClick={handleGenerate}>
          <RefreshCw size={18} />
          Generate Password
        </button>
        <button className="btn btn-secondary" onClick={handleCopy}>
          <Copy size={18} />
          Copy Password
        </button>
      </div>
    </div>
  );
}

export default Generator;
