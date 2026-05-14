import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  senderName: { type: String, default: 'System' },
  from: { type: String, enum: ['me', 'them'], required: true },
  text: { type: String, default: '' },
  type: { type: String, default: 'text' },
  time: { type: String, default: '' },
  createdAt: { type: Date, default: () => new Date() },
});

const chatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  isGroup: { type: Boolean, default: false },
  status: { type: String, default: 'online' },
  role: { type: String, default: '' },
  unread: { type: Number, default: 0 },
  lastMsg: { type: String, default: '' },
  time: { type: String, default: '' },
  color: [{ type: String }],
  messages: [messageSchema],
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
