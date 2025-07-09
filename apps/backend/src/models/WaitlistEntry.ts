import mongoose, { Schema, Document, Types } from 'mongoose';

export interface WaitlistEntryDocument extends Document {
  email: string;
  name?: string;
  referralCode: string;
  referredBy?: Types.ObjectId;
  status: 'pending' | 'invited' | 'joined';
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistEntrySchema = new Schema<WaitlistEntryDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: 'WaitlistEntry'
  },
  status: {
    type: String,
    enum: ['pending', 'invited', 'joined'],
    default: 'pending'
  },
  position: {
    type: Number,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
WaitlistEntrySchema.index({ email: 1 });
WaitlistEntrySchema.index({ referralCode: 1 });
WaitlistEntrySchema.index({ position: 1 });
WaitlistEntrySchema.index({ status: 1, position: 1 });

// Update timestamp on save
WaitlistEntrySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Generate unique referral code
WaitlistEntrySchema.statics.generateReferralCode = async function(): Promise<string> {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code: string;
  let exists: boolean;

  do {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    exists = await this.exists({ referralCode: code });
  } while (exists);

  return code;
};

export const WaitlistEntry = mongoose.model<WaitlistEntryDocument>('WaitlistEntry', WaitlistEntrySchema);