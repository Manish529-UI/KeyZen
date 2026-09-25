const crypto = require('crypto');

const ALGORITHM_GCM = 'aes-256-gcm';
const ALGORITHM_CBC = 'aes-256-cbc'; // Legacy fallback

/**
 * Encrypt a plain text string using AES-256-GCM (Authenticated Encryption).
 * AES-GCM provides both confidentiality AND integrity/authenticity.
 * Each call generates a random IV and produces an auth tag.
 */
const encrypt = (text) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(12); // 12 bytes for GCM (recommended)
  const cipher = crypto.createCipheriv(ALGORITHM_GCM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag, // Authentication tag to detect tampering
  };
};

/**
 * Decrypt an encrypted string.
 * Supports both AES-256-GCM (new) and AES-256-CBC (legacy) for backward compatibility.
 * If authTag is provided, uses GCM; otherwise falls back to CBC.
 */
const decrypt = (encryptedData, ivHex, authTag = null) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');

  // Use GCM if authTag is available (new encryption)
  if (authTag) {
    const decipher = crypto.createDecipheriv(ALGORITHM_GCM, key, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Fallback to CBC for legacy data (backward compatibility)
  const decipher = crypto.createDecipheriv(ALGORITHM_CBC, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { encrypt, decrypt };
