const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage
} = require('../controllers/chatController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/conversations', protect, getConversations);
router.get('/messages/:contactId', protect, getMessages);
router.post('/messages', protect, upload.single('attachment'), sendMessage);

module.exports = router;
