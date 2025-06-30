import mongoose, { Schema, Document } from 'mongoose';
import type { Reaction as ReactionType } from '@sonder/types';

interface ReactionDocument extends Omit<ReactionType, '_id'>, Document {}

const ReactionSchema = new Schema<ReactionDocument>({
  userId: { type: String }, // Optional for anonymous reactions
  targetUserId: { type: String, required: true },
  emoji: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index for fast reaction queries
ReactionSchema.index({ targetUserId: 1, emoji: 1 });
ReactionSchema.index({ userId: 1, targetUserId: 1, emoji: 1 }, { unique: true, sparse: true });

export const Reaction = mongoose.model<ReactionDocument>('Reaction', ReactionSchema);