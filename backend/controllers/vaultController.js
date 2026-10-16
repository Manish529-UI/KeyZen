const VaultItem = require('../models/VaultItem');
const { encrypt, decrypt } = require('../utils/encryption');

// @desc    Get all vault items for the logged-in user
// @route   GET /api/vault
const getItems = async (req, res) => {
  try {
    const items = await VaultItem.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Decrypt passwords before sending to client
    const decryptedItems = items.map((item) => ({
      _id: item._id,
      title: item.title,
      url: item.url,
      username: item.username,
      password: decrypt(item.encryptedPassword, item.iv, item.authTag),
      notes: item.notes,
      favorite: item.favorite,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.json(decryptedItems);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new vault item
// @route   POST /api/vault
const createItem = async (req, res) => {
  try {
    const { title, url, username, password, notes, favorite } = req.body;

    if (!title || !password) {
      return res.status(400).json({ message: 'Title and password are required' });
    }

    const { encryptedData, iv, authTag } = encrypt(password);

    const item = await VaultItem.create({
      userId: req.user._id,
      title,
      url: url || '',
      username: username || '',
      encryptedPassword: encryptedData,
      iv,
      authTag,
      notes: notes || '',
      favorite: favorite || false,
    });

    res.status(201).json({
      _id: item._id,
      title: item.title,
      url: item.url,
      username: item.username,
      password, // return plain password to client
      notes: item.notes,
      favorite: item.favorite,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a vault item
// @route   PUT /api/vault/:id
const updateItem = async (req, res) => {
  try {
    const item = await VaultItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Make sure user owns this item
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, url, username, password, notes, favorite } = req.body;

    if (title !== undefined) item.title = title;
    if (url !== undefined) item.url = url;
    if (username !== undefined) item.username = username;
    if (notes !== undefined) item.notes = notes;
    if (favorite !== undefined) item.favorite = favorite;

    // Re-encrypt if password was changed (uses AES-256-GCM)
    if (password) {
      const { encryptedData, iv, authTag } = encrypt(password);
      item.encryptedPassword = encryptedData;
      item.iv = iv;
      item.authTag = authTag;
    }

    await item.save();

    res.json({
      _id: item._id,
      title: item.title,
      url: item.url,
      username: item.username,
      password: decrypt(item.encryptedPassword, item.iv, item.authTag),
      notes: item.notes,
      favorite: item.favorite,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a vault item
// @route   DELETE /api/vault/:id
const deleteItem = async (req, res) => {
  try {
    const item = await VaultItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle favorite status
// @route   PATCH /api/vault/:id/favorite
const toggleFavorite = async (req, res) => {
  try {
    const item = await VaultItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    item.favorite = !item.favorite;
    await item.save();

    res.json({ favorite: item.favorite });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// Extension-specific endpoints
// ============================================================

/**
 * Extract a safe hostname from a URL string.
 * Returns null if the URL is invalid.
 */
const extractHostname = (urlString) => {
  if (!urlString) return null;
  try {
    // Ensure the URL has a protocol for parsing
    let normalized = urlString.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    const parsed = new URL(normalized);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Check if two hostnames match safely.
 * "accounts.google.com" matches domain "google.com"
 * "evil-google.com" does NOT match "google.com"
 */
const hostnameMatchesDomain = (hostname, domain) => {
  if (!hostname || !domain) return false;
  hostname = hostname.toLowerCase();
  domain = domain.toLowerCase();
  // Exact match
  if (hostname === domain) return true;
  // Subdomain match: hostname must end with ".domain"
  if (hostname.endsWith('.' + domain)) return true;
  return false;
};

// @desc    Save a credential from the browser extension
// @route   POST /api/vault/extension-save
const extensionSave = async (req, res) => {
  try {
    const { url, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Validate and sanitize the URL
    const hostname = extractHostname(url);
    if (!hostname) {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    // Auto-generate title from domain (capitalize first letter)
    const domainParts = hostname.split('.');
    const siteName = domainParts.length >= 2
      ? domainParts[domainParts.length - 2]
      : domainParts[0];
    const title = siteName.charAt(0).toUpperCase() + siteName.slice(1);

    // Sanitize username (trim, limit length)
    const sanitizedUsername = (username || '').trim().slice(0, 320);

    // Sanitize URL — store normalized form
    const sanitizedUrl = hostname;

    const { encryptedData, iv, authTag } = encrypt(password);

    const item = await VaultItem.create({
      userId: req.user._id,
      title,
      url: sanitizedUrl,
      username: sanitizedUsername,
      encryptedPassword: encryptedData,
      iv,
      authTag,
      notes: 'Saved from KeyZen browser extension',
      favorite: false,
    });

    res.status(201).json({
      _id: item._id,
      title: item.title,
      url: item.url,
      username: item.username,
      createdAt: item.createdAt,
    });
  } catch (error) {
    console.error('Extension save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vault items matching a domain (for autofill)
// @route   GET /api/vault/extension-matches?domain=example.com
const extensionMatches = async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ message: 'Domain parameter is required' });
    }

    // Sanitize the domain
    const sanitizedDomain = extractHostname(domain) || domain.toLowerCase().trim();

    if (!sanitizedDomain || sanitizedDomain.length > 253) {
      return res.status(400).json({ message: 'Invalid domain' });
    }

    // Get all vault items for the user
    const items = await VaultItem.find({ userId: req.user._id });

    // Filter items whose stored URL matches the requested domain
    const matches = items
      .filter((item) => {
        const storedHostname = extractHostname(item.url) || (item.url || '').toLowerCase().trim();
        return hostnameMatchesDomain(sanitizedDomain, storedHostname) ||
               hostnameMatchesDomain(storedHostname, sanitizedDomain);
      })
      .map((item) => ({
        _id: item._id,
        title: item.title,
        url: item.url,
        username: item.username,
        password: decrypt(item.encryptedPassword, item.iv, item.authTag),
        createdAt: item.createdAt,
      }));

    res.json(matches);
  } catch (error) {
    console.error('Extension matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getItems, createItem, updateItem, deleteItem, toggleFavorite, extensionSave, extensionMatches };
