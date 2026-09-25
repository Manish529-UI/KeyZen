const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  url: {
    type: String,
    trim: true,
    default: '',
  },
  username: {
    type: String,
    trim: true,
    default: '',
  },
  encryptedPassword: {
    type: String,
    required: true,
  },
  iv: {
    type: String,
    required: true,
  },
  // Auth tag for AES-256-GCM authenticated encryption
  // Null for legacy items encrypted with AES-256-CBC
  authTag: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  favorite: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('VaultItem', vaultItemSchema);
