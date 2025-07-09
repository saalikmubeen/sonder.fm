import mongoose, { Schema, Document, Types } from 'mongoose';

export type ActivityType =
  | 'room_join'
  | 'room_leave'
  | 'room_create'
  | 'vibe_note'
  | 'reaction'
  | 'follow'
  | 'unfollow'
  | 'bookmark'
  | 'bookmark_delete'
  | 'profile_update'
  | 'theme_change'
  | 'track_play'
  | 'playlist_export'
  | 'message_send';

export interface ActivityDocument extends Document {
  actorId: Types.ObjectId;
  actorName: string;
  actorAvatar: string;
  actorSlug: string;
  
  type: ActivityType;
  
  // Target entities (optional based on activity type)
  targetUserId?: Types.ObjectId;
  targetUserName?: string;
  targetUserSlug?: string;
  
  roomId?: string;
  roomName?: string;
  
  trackId?: string;
  trackName?: string;
  trackArtist?: string;
  trackAlbum?: string;
  trackImage?: string;
  
  // Flexible metadata for activity-specific data
  metadata?: {
    emoji?: string; // for reactions
    noteText?: string; // for vibe notes (truncated)
    isAnonymous?: boolean; // for vibe notes
    theme?: string; // for theme changes
    caption?: string; // for bookmarks
    timestamp?: number; // for track bookmarks
    playlistName?: string; // for playlist exports
    messagePreview?: string; // for messages (truncated)
    [key: string]: any;
  };
  
  createdAt: Date;
}

const ActivitySchema = new Schema<ActivityDocument>({
  // Actor (who performed the action)
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true },
  actorAvatar: { type: String, required: true },
  actorSlug: { type: String, required: true },
  
  // Activity type
  type: {
    type: String,
    enum: [
      'room_join',
      'room_leave', 
      'room_create',
      'vibe_note',
      'reaction',
      'follow',
      'unfollow',
      'bookmark',
      'bookmark_delete',
      'profile_update',
      'theme_change',
      'track_play',
      'playlist_export',
      'message_send'
    ],
    required: true
  },
  
  // Target entities
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  targetUserName: { type: String },
  targetUserSlug: { type: String },
  
  roomId: { type: String },
  roomName: { type: String },
  
  trackId: { type: String },
  trackName: { type: String },
  trackArtist: { type: String },
  trackAlbum: { type: String },
  trackImage: { type: String },
  
  // Flexible metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
ActivitySchema.index({ actorId: 1, createdAt: -1 });
ActivitySchema.index({ targetUserId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: -1 });

// Compound indexes for common queries
ActivitySchema.index({ actorId: 1, type: 1, createdAt: -1 });

export const Activity = mongoose.model<ActivityDocument>('Activity', ActivitySchema);