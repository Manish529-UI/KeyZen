const express = require('express');
const router = express.Router();
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  toggleFavorite,
  extensionSave,
  extensionMatches,
} = require('../controllers/vaultController');
const auth = require('../middleware/auth');

// All vault routes require authentication
router.use(auth);

// Extension-specific routes (must be BEFORE /:id routes)
router.post('/extension-save', extensionSave);
router.get('/extension-matches', extensionMatches);

router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
