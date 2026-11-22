const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user's chat conversations list
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatar role isVerified')
      .populate('recipient', 'name avatar role isVerified');

    // Group by contact user
    const conversationMap = new Map();

    messages.forEach(msg => {
      const isSender = msg.sender._id.toString() === currentUserId;
      const contactUser = isSender ? msg.recipient : msg.sender;
      if (!contactUser) return;
      const contactId = contactUser._id.toString();

      if (!conversationMap.has(contactId)) {
        conversationMap.set(contactId, {
          contact: contactUser,
          lastMessage: msg,
          unreadCount: 0
        });
      }

      if (!isSender && !msg.isRead) {
        const item = conversationMap.get(contactId);
        item.unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get messages between logged in user and another user
// @route   GET /api/chat/messages/:contactId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const contactId = req.params.contactId;

    const { projectId, orderId } = req.query;

    let query = {
      $or: [
        { sender: currentUserId, recipient: contactId },
        { sender: contactId, recipient: currentUserId }
      ]
    };

    if (projectId) query.project = projectId;
    if (orderId) query.order = orderId;

    const messages = await Message.find(query)
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role')
      .sort({ createdAt: 1 });

    // Mark received unread messages as read
    await Message.updateMany(
      { sender: contactId, recipient: currentUserId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, text, projectId, orderId } = req.body;
    const senderId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Please specify message recipient' });
    }

    let attachmentUrl = '';
    let attachmentName = '';

    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      text: text || '',
      attachmentUrl,
      attachmentName,
      project: projectId || null,
      order: orderId || null
    });

    // Notify recipient
    await Notification.create({
      user: recipientId,
      title: `New message from ${req.user.name}`,
      message: text ? (text.length > 50 ? text.substring(0, 47) + '...' : text) : 'Sent an attachment',
      type: 'message',
      link: '/messages'
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (err) {
    next(err);
  }
};
