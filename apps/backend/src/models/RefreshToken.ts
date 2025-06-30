import mongoose, { Schema, Document } from 'mongoose';
import type { User as UserType, RefreshToken as RefreshTokenType } from '@sonder/types';

interface RefreshTokenDocument extends Omit<RefreshTokenType, '_id'>, Document {}

const refreshTokenSchema = new mongoose.Schema<RefreshTokenDocument>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});




export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
