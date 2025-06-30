import mongoose, { Schema, Document } from 'mongoose';
import type { VibeNote as VibeNoteType } from '@sonder/types';

interface VibeNoteDocument extends Omit<VibeNoteType, '_id'>, Document {}

const VibeNoteSchema = new Schema<VibeNoteDocument>({
  targetUserId: { type: String, required: true },
  note: { type: String, required: true, maxlength: 300 },
  isAnonymous: { type: Boolean, default: true },
  authorId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Index for fast note queries
VibeNoteSchema.index({ targetUserId: 1, createdAt: -1 });
VibeNoteSchema.index({ authorId: 1 });

export const VibeNote = mongoose.model<VibeNoteDocument>('VibeNote', VibeNoteSchema);