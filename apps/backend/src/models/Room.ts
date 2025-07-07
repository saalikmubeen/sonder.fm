import mongoose, { Schema, Document, Types } from 'mongoose';

export interface RoomDocument extends Document {
  roomId: string;
  name: string;
  hostId: Types.ObjectId;
  hostSpotifyId: string;
  isPublic: boolean;
  participants: Types.ObjectId[];
  currentTrack?: {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    spotifyUrl: string;
    durationMs: number;
  };
  songHistory: Array<{
    trackId: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    spotifyUrl: string;
    durationMs: number;
    playedAt: Date;
    playedBy: Types.ObjectId;
  }>;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SongHistorySchema = new Schema({
  trackId: { type: String, required: true },
  name: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, required: true },
  albumArt: { type: String, required: true },
  spotifyUrl: { type: String, required: true },
  durationMs: { type: Number, required: true },
  playedAt: { type: Date, default: Date.now },
  playedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const CurrentTrackSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, required: true },
  albumArt: { type: String, required: true },
  spotifyUrl: { type: String, required: true },
  durationMs: { type: Number, required: true },
});

const RoomSchema = new Schema<RoomDocument>({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hostSpotifyId: { type: String, required: true },
  isPublic: { type: Boolean, default: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  currentTrack: CurrentTrackSchema,
  songHistory: [SongHistorySchema],
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient queries
RoomSchema.index({ roomId: 1 });
RoomSchema.index({ isPublic: 1, lastActive: -1 });
RoomSchema.index({ participants: 1 });
RoomSchema.index({ hostId: 1 });

// Update lastActive and updatedAt on save
RoomSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  this.lastActive = new Date();
  next();
});

export const Room = mongoose.model<RoomDocument>('Room', RoomSchema);