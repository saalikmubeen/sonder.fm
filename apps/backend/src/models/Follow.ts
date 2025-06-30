import mongoose, { Schema, Document } from 'mongoose';
import type { Follow as FollowType } from '@sonder/types';

interface FollowDocument extends Omit<FollowType, '_id'>, Document {}

const FollowSchema = new Schema<FollowDocument>({
  followerId: { type: String, required: true },
  followingId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate follows and for fast lookups
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followerId: 1 });
FollowSchema.index({ followingId: 1 });

export const Follow = mongoose.model<FollowDocument>('Follow', FollowSchema);