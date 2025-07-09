import mongoose, { Schema, Document } from 'mongoose';
import type { Bookmark as BookmarkType } from '@sonder/types';

export interface BookmarkDocument
  extends Omit<BookmarkType, '_id'>,
    Document {}

const BookmarkSchema = new Schema<BookmarkDocument>({
  userId: { type: String, required: true },
  trackId: { type: String, required: true },
  timestampMs: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  caption: { type: String, maxlength: 500 },
  metadata: {
    name: { type: String, required: true },
    artists: [
      {
        name: { type: String, required: true },
      },
    ],
    album: {
      name: { type: String, required: true },
      imageUrl: { type: String, required: true },
    },
    spotifyUrl: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for fast bookmark queries
BookmarkSchema.index({ userId: 1, createdAt: -1 });
BookmarkSchema.index({ trackId: 1 });
BookmarkSchema.index({ userId: 1, trackId: 1, timestampMs: 1 });

export const Bookmark = mongoose.model<BookmarkDocument>(
  'Bookmark',
  BookmarkSchema
);
