import mongoose, { Schema, Document } from 'mongoose';

export interface TagDocument extends Document {
  name: string;
  category: 'mood' | 'genre' | 'custom';
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<TagDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 20,
    match: /^[a-zA-Z0-9\s\-]+$/
  },
  category: {
    type: String,
    enum: ['mood', 'genre', 'custom'],
    default: 'custom'
  },
  usageCount: {
    type: Number,
    default: 1
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for fast queries
TagSchema.index({ name: 1 });
TagSchema.index({ usageCount: -1 });
TagSchema.index({ category: 1, usageCount: -1 });

// Update timestamp on save
TagSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Tag = mongoose.model<TagDocument>('Tag', TagSchema);