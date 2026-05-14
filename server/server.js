import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import chatsRoutes from './routes/chats.js';
import Chat from './models/Chat.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/connectify_db';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Server error' });
});

mongoose.set('strictQuery', false);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) return next(new Error('Invalid token'));

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.join(`user_${user._id}`);
  console.log(`Socket connected: ${user.email} (${socket.id})`);

  socket.on('send_message', async ({ chatId, text }, callback) => {
    if (!chatId || !text?.trim()) {
      return callback?.({ status: 'error', error: 'Chat ID and message text are required.' });
    }

    try {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.some((id) => id.toString() === user._id.toString())) {
        return callback?.({ status: 'error', error: 'Chat not found or access denied.' });
      }

      const messageData = {
        senderId: user._id,
        senderName: user.name,
        from: 'me',
        text: text.trim(),
        type: 'text',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      chat.messages.push(messageData);
      chat.lastMsg = messageData.text;
      chat.time = messageData.time;
      await chat.save();

      const savedMessage = chat.messages[chat.messages.length - 1].toObject();
      const outgoingMessage = { ...savedMessage, id: savedMessage._id.toString() };
      const chatPayload = {
        chatId: chat._id.toString(),
        message: outgoingMessage,
      };
      const chatSummary = {
        chatId: chat._id.toString(),
        lastMsg: chat.lastMsg,
        time: chat.time,
      };

      // Send live updates to all other participants, but avoid duplicate delivery to the sender's active socket.
      chat.participants.forEach((participantId) => {
        if (participantId.toString() === user._id.toString()) return;
        io.to(`user_${participantId.toString()}`).emit('message_received', chatPayload);
        io.to(`user_${participantId.toString()}`).emit('chat_updated', chatSummary);
      });

      // If the sender has multiple active sockets, notify the other sessions as well.
      socket.broadcast.to(`user_${user._id}`).emit('message_received', chatPayload);
      socket.broadcast.to(`user_${user._id}`).emit('chat_updated', chatSummary);

      callback?.({ status: 'ok', message: outgoingMessage });
    } catch (error) {
      console.error('Socket send MESSAGE error:', error);
      callback?.({ status: 'error', error: 'Failed to send message.' });
    }
  });

  socket.on('send_code_message', async ({ chatId, code, language }, callback) => {
    if (!chatId || !code?.trim()) {
      return callback?.({ status: 'error', error: 'Chat ID and code are required.' });
    }

    if (!language || !['javascript', 'python'].includes(language)) {
      return callback?.({ status: 'error', error: 'Unsupported language. Supported: javascript, python' });
    }

    try {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.some((id) => id.toString() === user._id.toString())) {
        return callback?.({ status: 'error', error: 'Chat not found or access denied.' });
      }

      // Execute code using JDoodle API
      const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
      const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;
      const JDOODLE_API_URL = 'https://api.jdoodle.com/v1/execute';
      const LANGUAGE_IDS = { javascript: 'nodejs', python: 'python3' };

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

      const messageData = {
        senderId: user._id,
        senderName: user.name,
        from: 'me',
        text: `Code executed (${language})`,
        type: 'code',
        code: code.trim(),
        language,
        output: output.trim(),
        executionStatus,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      chat.messages.push(messageData);
      chat.lastMsg = messageData.text;
      chat.time = messageData.time;
      await chat.save();

      const savedMessage = chat.messages[chat.messages.length - 1].toObject();
      const outgoingMessage = { ...savedMessage, id: savedMessage._id.toString() };
      const chatPayload = {
        chatId: chat._id.toString(),
        message: outgoingMessage,
      };
      const chatSummary = {
        chatId: chat._id.toString(),
        lastMsg: chat.lastMsg,
        time: chat.time,
      };

      // Send live updates to all other participants
      chat.participants.forEach((participantId) => {
        if (participantId.toString() === user._id.toString()) return;
        io.to(`user_${participantId.toString()}`).emit('message_received', chatPayload);
        io.to(`user_${participantId.toString()}`).emit('chat_updated', chatSummary);
      });

      // Notify other sessions of the sender
      socket.broadcast.to(`user_${user._id}`).emit('message_received', chatPayload);
      socket.broadcast.to(`user_${user._id}`).emit('chat_updated', chatSummary);

      callback?.({ status: 'ok', message: outgoingMessage });
    } catch (error) {
      console.error('Socket send CODE MESSAGE error:', error);
      callback?.({ status: 'error', error: 'Failed to execute and send code.' });
    }
  });

  socket.on('search_user', async ({ username }, callback) => {
    if (!username || !username.trim()) {
      return callback?.({ status: 'error', error: 'Username search is required.' });
    }

    try {
      const query = username.trim().toLowerCase();
      const users = await User.find({
        username: { $regex: new RegExp(`^${query}`), $options: 'i' },
        _id: { $ne: user._id },
      })
        .limit(10)
        .select('_id name username');

      callback?.({ status: 'ok', users });
    } catch (error) {
      console.error('Socket search user error:', error);
      callback?.({ status: 'error', error: 'Search failed.' });
    }
  });

  socket.on('create_private_chat', async ({ username }, callback) => {
    if (!username || !username.trim()) {
      return callback?.({ status: 'error', error: 'Username is required.' });
    }

    try {
      const target = await User.findOne({ username: username.trim().toLowerCase() });
      if (!target) {
        return callback?.({ status: 'error', error: 'User not found.' });
      }
      if (target._id.toString() === user._id.toString()) {
        return callback?.({ status: 'error', error: 'Cannot chat with yourself.' });
      }

      let chat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [user._id, target._id] },
      });

      if (!chat) {
        chat = await Chat.create({
          name: target.name,
          participants: [user._id, target._id],
          isGroup: false,
          status: 'online',
          role: target.username,
          unread: 0,
          lastMsg: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          color: ['#1a1a1a', '#34d399'],
          messages: [],
        });
      }

      const chatPayload = {
        _id: chat._id.toString(),
        name: chat.name,
        isGroup: chat.isGroup,
        status: chat.status,
        role: chat.role,
        unread: chat.unread,
        lastMsg: chat.lastMsg,
        time: chat.time,
        color: chat.color,
      };

      io.to(`user_${target._id}`).emit('chat_created', { chat: chatPayload });
      callback?.({ status: 'ok', chat: chatPayload });
    } catch (error) {
      console.error('Socket create private chat error:', error);
      callback?.({ status: 'error', error: 'Failed to create chat.' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${user.email} (${socket.id})`, reason);
  });
});

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
