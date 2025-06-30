import mongoose, { Schema, Document } from 'mongoose';
import type { User as UserType, UserStats, NowPlaying, ProfileTheme } from '@sonder/types';

interface UserDocument extends Omit<UserType, '_id'>, Document {}

const UserStatsSchema = new Schema<UserStats>({
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  totalMinutesListened: { type: Number, default: 0 },
  topGenres: [{ type: String }],
  recentTracks: { type: Number, default: 0 }
});

const NowPlayingSchema = new Schema<NowPlaying>({
  song: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, required: true },
  albumArt: { type: String, required: true },
  spotifyUrl: { type: String, required: true },
  previewUrl: { type: String },
  isPlaying: { type: Boolean, required: true },
  progressMs: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const UserSchema = new Schema<UserDocument>({
  spotifyId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  email: { type: String, required: true },
  refreshTokenEncrypted: { type: String, required: true },
  publicSlug: { type: String, required: true, unique: true },
  profileTheme: {
    type: String,
    enum: ['default', 'dark', 'pastel', 'grunge', 'sadcore', 'neon', 'forest'],
    default: 'default'
  },
  vibeSummary: { type: String, default: '' },
  topArtists: [{ type: String }],
  stats: { type: UserStatsSchema, default: () => ({}) },
  cachedNowPlaying: { type: NowPlayingSchema },
  cachedUpdatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
UserSchema.index({ publicSlug: 1 });
UserSchema.index({ spotifyId: 1 });
UserSchema.index({ displayName: 'text' });

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model<UserDocument>('User', UserSchema);