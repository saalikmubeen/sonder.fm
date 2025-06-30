import mongoose, { Schema, Document } from 'mongoose';
import type { Message as MessageType } from '@sonder/types';

interface MessageDocument extends Omit<MessageType, '_id'>, Document {}

const MessageSchema = new Schema<MessageDocument>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true, maxlength: 1000 },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for fast message queries
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

export const Message = mongoose.model<MessageDocument>('Message', MessageSchema);