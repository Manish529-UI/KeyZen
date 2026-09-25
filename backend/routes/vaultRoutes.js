const express = require('express');
const router = express.Router();
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  toggleFavorite,
} = require('../controllers/vaultController');
const auth = require('../middleware/auth');

// All vault routes require authentication
router.use(auth);

router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
