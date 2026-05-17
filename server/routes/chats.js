import express from 'express';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const formatTime = (date = new Date()) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// JDoodle API configuration
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;
const JDOODLE_API_URL = 'https://api.jdoodle.com/v1/execute';

// Language ID mapping for JDoodle
const LANGUAGE_IDS = {
  javascript: 'nodejs',  // Node.js
  python: 'python3',     // Python 3
};

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const hiddenChatNames = ['Priya Sharma', 'Dev Squad 🚀', 'Connectify Team'];
    const chats = await Chat.find({ participants: req.user._id }).sort({ updatedAt: -1 }).populate('participants', 'name username profilePhoto');
    const filtered = chats.filter(chat => !hiddenChatNames.includes(chat.name));
    const sanitized = filtered.map(chat => {
      const otherParticipant = !chat.isGroup
        ? chat.participants.find((user) => user._id.toString() !== req.user._id.toString())
        : null;
      return {
        _id: chat._id,
        name: chat.name,
        isGroup: chat.isGroup,
        status: chat.status,
        role: chat.role,
        unread: chat.unread,
        lastMsg: chat.lastMsg,
        time: chat.time,
        color: chat.color,
        profilePhoto: otherParticipant?.profilePhoto || '',
        participantId: otherParticipant?._id?.toString() || null,
      };
    });
    res.json(sanitized);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Could not load chats.' });
  }
});

router.get('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  try {
    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }
    res.json(chat.messages || []);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

router.post('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  try {
    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const message = {
      senderId: req.user._id,
      senderName: req.user.name,
      from: 'me',
      text: text.trim(),
      type: 'text',
      time: formatTime(),
    };

    chat.messages.push(message);
    chat.lastMsg = message.text;
    chat.time = message.time;
    chat.unread = 0;
    await chat.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Could not send message.' });
  }
});

// Execute code using Judge0 API
router.post('/:chatId/execute-code', async (req, res) => {
  const { chatId } = req.params;
  const { code, language } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Code is required.' });
  }

  if (!language || !LANGUAGE_IDS[language]) {
    return res.status(400).json({ error: 'Unsupported language. Supported: javascript, python' });
  }

  try {
    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    // Execute code using JDoodle API
    const executionResponse = await fetch(JDOODLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: code.trim(),
        language: LANGUAGE_IDS[language],
        versionIndex: '0',
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
      }),
    });

    if (!executionResponse.ok) {
      throw new Error('Failed to execute code');
    }

    const result = await executionResponse.json();

    let output = '';
    let executionStatus = 'success';

    if (result.statusCode === 200) {
      output = result.output || '';
    } else {
      output = result.output || 'Execution failed';
      executionStatus = 'error';
    }

    // Create code message
    const message = {
      senderId: req.user._id,
      senderName: req.user.name,
      from: 'me',
      text: `Code executed (${language})`,
      type: 'code',
      code: code.trim(),
      language,
      output: output.trim(),
      executionStatus,
      time: formatTime(),
    };

    chat.messages.push(message);
    chat.lastMsg = message.text;
    chat.time = message.time;
    chat.unread = 0;
    await chat.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error('Execute code error:', error);
    res.status(500).json({ error: 'Could not execute code.' });
  }
});

router.post('/private', async (req, res) => {
  const { username } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required to start a chat.' });
  }

  try {
    const target = await User.findOne({ username: username.trim().toLowerCase() });
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot create a chat with yourself.' });
    }

    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, target._id] },
    });

    if (!chat) {
      chat = await Chat.create({
        name: target.name,
        participants: [req.user._id, target._id],
        isGroup: false,
        status: 'online',
        role: target.username,
        unread: 0,
        lastMsg: '',
        time: formatTime(),
        color: ['#1a1a1a', '#34d399'],
        messages: [],
      });
    }

    res.status(201).json({ chat: {
      _id: chat._id,
      name: chat.name,
      isGroup: chat.isGroup,
      status: chat.status,
      role: chat.role,
      unread: chat.unread,
      lastMsg: chat.lastMsg,
      time: chat.time,
      color: chat.color,
      profilePhoto: target.profilePhoto || '',
      participantId: target._id.toString(),
    } });
  } catch (error) {
    console.error('Create private chat error:', error);
    res.status(500).json({ error: 'Could not create chat.' });
  }
});

export default router;
