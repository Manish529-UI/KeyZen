/**
 * Calculate password strength on a 0-4 scale.
 * Returns { level, label, color }
 */
export function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: 'var(--danger)' };
  if (score <= 4) return { level: 2, label: 'Fair', color: 'var(--warning)' };
  if (score <= 5) return { level: 3, label: 'Good', color: 'var(--accent)' };
  return { level: 4, label: 'Strong', color: 'var(--success)' };
}

/**
 * Generate a random password with given options.
 */
export function generatePassword(length = 16, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  const charSets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  let chars = '';
  let password = '';

  if (lowercase) chars += charSets.lowercase;
  if (uppercase) chars += charSets.uppercase;
  if (numbers) chars += charSets.numbers;
  if (symbols) chars += charSets.symbols;

  // Fallback if nothing selected
  if (!chars) chars = charSets.lowercase + charSets.uppercase + charSets.numbers;

  // Ensure at least one char from each selected type
  if (lowercase) password += charSets.lowercase[Math.floor(Math.random() * charSets.lowercase.length)];
  if (uppercase) password += charSets.uppercase[Math.floor(Math.random() * charSets.uppercase.length)];
  if (numbers) password += charSets.numbers[Math.floor(Math.random() * charSets.numbers.length)];
  if (symbols) password += charSets.symbols[Math.floor(Math.random() * charSets.symbols.length)];

  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Fisher-Yates shuffle
  const arr = password.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join('');
}

/**
 * Analyze vault items for password health.
 * Returns { score, strong, weak, reused, old, needsAttention }
 */
export function analyzeVault(items) {
  const total = items.length;
  if (total === 0) {
    return { score: 100, strong: 0, weak: 0, reused: 0, old: 0, needsAttention: [] };
  }

  let strong = 0;
  let weak = 0;
  const passwordCounts = {};
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  let old = 0;

  items.forEach((item) => {
    const strength = getPasswordStrength(item.password);
    if (strength.level >= 3) strong++;
    else weak++;

    // Track reused passwords
    passwordCounts[item.password] = (passwordCounts[item.password] || 0) + 1;

    // Check if password is old
    if (new Date(item.updatedAt) < ninetyDaysAgo) old++;
  });

  // Count items with reused passwords
  const reused = Object.values(passwordCounts)
    .filter((count) => count > 1)
    .reduce((sum, count) => sum + count, 0);

  // Calculate score (0-100)
  const strengthScore = (strong / total) * 50;
  const uniqueScore = ((total - reused) / total) * 30;
  const freshnessScore = ((total - old) / total) * 20;
  const score = Math.round(strengthScore + uniqueScore + freshnessScore);

  // Build list of items needing attention
  const needsAttention = [];
  items.forEach((item) => {
    const issues = [];
    const strength = getPasswordStrength(item.password);
    if (strength.level <= 1) issues.push('Weak');
    else if (strength.level === 2) issues.push('Fair');
    if (passwordCounts[item.password] > 1) issues.push('Reused');
    if (new Date(item.updatedAt) < ninetyDaysAgo) issues.push('Old');
    if (issues.length > 0) {
      needsAttention.push({ ...item, issues });
    }
  });

  return { score, strong, weak, reused, old, needsAttention };
}
