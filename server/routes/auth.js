import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const createInitialChats = (user) => {
  return [];
};

const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: 'Name, username, email, and password are required.' });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username: username.toLowerCase(), email, passwordHash });
    const chats = createInitialChats(user);
    await Chat.insertMany(chats);

    const token = signToken(user._id);
    return res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, username: user.username, profilePhoto: user.profilePhoto || '' } });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to register user.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    return res.json({ token, user: { _id: user._id, name: user.name, email: user.email, username: user.username, profilePhoto: user.profilePhoto || '' } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, username: req.user.username, profilePhoto: req.user.profilePhoto || '' });
});

router.put('/profile', authMiddleware, async (req, res) => {
  const { name, username, profilePhoto } = req.body;
  try {
    if (username && username.trim().toLowerCase() !== req.user.username) {
      const existingUsername = await User.findOne({ username: username.trim().toLowerCase() });
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
    }

    req.user.name = name?.trim() || req.user.name;
    req.user.username = username?.trim().toLowerCase() || req.user.username;
    if (profilePhoto !== undefined) {
      req.user.profilePhoto = profilePhoto;
    }
    await req.user.save();

    res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, username: req.user.username, profilePhoto: req.user.profilePhoto || '' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

router.put('/profile/password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new password are required.' });
  }
  try {
    const isMatch = await bcrypt.compare(oldPassword, req.user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Old password is incorrect.' });
    }
    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Could not change password.' });
  }
});

router.get('/search', authMiddleware, async (req, res) => {
  const { username } = req.query;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required for search.' });
  }

  try {
    const query = username.trim().toLowerCase();
    const users = await User.find({
      username: { $regex: new RegExp(`^${query}`), $options: 'i' },
      _id: { $ne: req.user._id },
    })
      .limit(10)
      .select('_id name username');

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users.' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ ok: true });
});

export default router;
