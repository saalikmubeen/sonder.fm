import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { auth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';
import { ActivityLogger } from '../utils/activityLogger';

const router = express.Router();

// Validation middleware using express-validator
const validateSlug = [
  param('slug')
    .isString()
    .withMessage('Slug must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Slug must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Slug can only contain letters, numbers, hyphens, and underscores'),
];



const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Follow a user
router.post('/:slug', auth, validateSlug, handleValidationErrors, async (req: AuthRequest, res: express.Response) => {
  try {
    const { slug } = req.params;
    const followerId = req.userId!;

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Can't follow yourself
    if (targetUser._id.toString() === followerId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot follow yourself'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      followerId,
      followingId: targetUser._id
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: 'You are already following this user'
      });
    }

    // Create follow relationship
    const follow = new Follow({
      followerId,
      followingId: targetUser._id
    });

    await follow.save();

    // Log activity
    ActivityLogger.follow(followerId, targetUser._id.toString());

    res.json({
      success: true,
      message: 'Successfully followed user'
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow user'
    });
  }
});

// Unfollow a user
router.delete('/:slug', auth, validateSlug, handleValidationErrors, async (req: AuthRequest, res: express.Response) => {
  try {
    const { slug } = req.params;
    const followerId = req.userId!;

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove follow relationship
    const result = await Follow.findOneAndDelete({
      followerId,
      followingId: targetUser._id
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'You are not following this user'
      });
    }

    // Log activity
    ActivityLogger.unfollow(followerId, targetUser._id.toString());

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user'
    });
  }
});

// Get user's followers
router.get('/:slug/followers', auth, validateSlug, handleValidationErrors, async (req: AuthRequest, res: express.Response) => {
  try {
    const { slug } = req.params;

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get followers
    const followers = await Follow.find({ followingId: targetUser._id })
      .populate('followerId', 'displayName avatarUrl publicSlug profileTheme')
      .sort({ createdAt: -1 });

    const followerUsers = followers.map(follow => follow.followerId);

    const response: APIResponse<{ followers: any[] }> = {
      success: true,
      data: { followers: followerUsers }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch followers'
    });
  }
});

// Get users that a user is following
router.get('/:slug/following', auth, validateSlug, handleValidationErrors, async (req: AuthRequest, res: express.Response) => {
  try {
    const { slug } = req.params;

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get following
    const following = await Follow.find({ followerId: targetUser._id })
      .populate('followingId', 'displayName avatarUrl publicSlug profileTheme')
      .sort({ createdAt: -1 });

    const followingUsers = following.map(follow => follow.followingId);

    const response: APIResponse<{ following: any[] }> = {
      success: true,
      data: { following: followingUsers }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch following'
    });
  }
});

// Check if current user is following a specific user
router.get('/:slug/status', auth, validateSlug, handleValidationErrors, async (req: AuthRequest, res: express.Response) => {
  try {
    const { slug } = req.params;
    const followerId = req.userId!;

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if following
    const isFollowing = await Follow.exists({
      followerId,
      followingId: targetUser._id
    });

    const response: APIResponse<{ isFollowing: boolean }> = {
      success: true,
      data: { isFollowing: !!isFollowing }
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check follow status'
    });
  }
});

// Get follower and following counts for a user
router.get('/:slug/counts', validateSlug, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { slug } = req.params;

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get counts
    const followerCount = await Follow.countDocuments({ followingId: targetUser._id });
    const followingCount = await Follow.countDocuments({ followerId: targetUser._id });

    const response: APIResponse<{ followerCount: number; followingCount: number }> = {
      success: true,
      data: { followerCount, followingCount }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow counts'
    });
  }
});

export default router;