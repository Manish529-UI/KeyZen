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

module.exports = { getItems, createItem, updateItem, deleteItem, toggleFavorite };
