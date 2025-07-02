import express from 'express';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { auth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';

const router = express.Router();

// Get current user profile
router.get('/me', auth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId).select(
      '-refreshTokenEncrypted'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const response: APIResponse<{ user: any }> = {
      success: true,
      data: { user },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// Update user profile
router.put('/me', auth, async (req: AuthRequest, res) => {
  try {
    const { displayName, vibeSummary } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (displayName) user.displayName = displayName;
    if (vibeSummary) user.vibeSummary = vibeSummary;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toObject() },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// Force refresh user's now playing
router.post('/me/refresh', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // await forceUpdateUser(userId);

    const updatedUser = await User.findById(userId).select(
      '-refreshTokenEncrypted'
    );

    res.json({
      success: true,
      message: 'Now playing updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Error refreshing now playing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh now playing',
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const users = await User.find({
      $or: [
        { displayName: { $regex: q, $options: 'i' } },
        { publicSlug: { $regex: q, $options: 'i' } },
      ],
    })
      .select(
        'displayName avatarUrl publicSlug profileTheme vibeSummary stats'
      )
      .limit(parseInt(limit as string))
      .sort({ 'stats.followers': -1 });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    });
  }
});

// Get user stats
router.get('/me/stats', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get follower count
    const followerCount = await Follow.countDocuments({
      followingId: userId,
    });

    // Get following count
    const followingCount = await Follow.countDocuments({
      followerId: userId,
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      'stats.followers': followerCount,
      'stats.following': followingCount,
    });

    const user = await User.findById(userId).populate(
      'spotifyProfile',
      'spotifyId displayName avatarUrl followers following'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    // Return user stats

    res.json({
      success: true,
      data: { stats: user?.spotifyProfile },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
    });
  }
});

export default router;
