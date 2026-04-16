import mongoose from 'mongoose';

const ChatSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "New Chat",
  },
  mood: {
    type: String,
    default: "default",
  },
  messages: {
    type: Array, // Array of { role: 'user'|'bot', content: String }
    default: [],
  },
}, { timestamps: true });

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);
