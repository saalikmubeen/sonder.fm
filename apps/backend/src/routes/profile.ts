import express from 'express';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { Reaction } from '../models/Reaction';
import { VibeNote } from '../models/VibeNote';
import { auth } from '../middleware/auth';
import type { APIResponse, PublicProfile } from '@sonder/types';

const router = express.Router();

// Get public profile by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const currentUserId = req.headers.authorization ? await getCurrentUserId(req.headers.authorization) : null;

    const user = await User.findOne({ publicSlug: slug });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Get reactions count
    const reactions = await Reaction.aggregate([
      { $match: { targetUserId: user._id } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } }
    ]);

    const reactionCounts: { [emoji: string]: number } = {};
    reactions.forEach(r => {
      reactionCounts[r._id] = r.count;
    });

    // Get recent vibe notes
    const vibeNotes = await VibeNote.find({ targetUserId: user._id })
      .populate('authorId', 'displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(10);

    // Check if current user is following this profile
    let isFollowing = false;
    if (currentUserId) {
      const followRecord = await Follow.findOne({
        followerId: currentUserId,
        followingId: user._id
      });
      isFollowing = !!followRecord;
    }

    const publicProfile: PublicProfile = {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      publicSlug: user.publicSlug,
      profileTheme: user.profileTheme,
      vibeSummary: user.vibeSummary,
      nowPlaying: user.cachedNowPlaying,
      stats: user.stats,
      reactions: reactionCounts,
      vibeNotes: vibeNotes.map(note => ({
        ...note.toObject(),
        authorId: note.isAnonymous ? undefined : note.authorId
      })),
      isFollowing
    };

    const response: APIResponse<PublicProfile> = {
      success: true,
      data: publicProfile
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update theme
router.put('/:slug/theme', auth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { theme } = req.body;
    const userId = (req as any).userId;

    const user = await User.findOne({ publicSlug: slug });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Check if user owns this profile
    if (user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile'
      });
    }

    const validThemes = ['default', 'dark', 'pastel', 'grunge', 'sadcore', 'neon', 'forest'];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid theme'
      });
    }

    user.profileTheme = theme;
    await user.save();

    res.json({
      success: true,
      message: 'Theme updated successfully'
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update theme'
    });
  }
});

async function getCurrentUserId(authHeader: string): Promise<string | null> {
  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId;
  } catch {
    return null;
  }
}

export default router;