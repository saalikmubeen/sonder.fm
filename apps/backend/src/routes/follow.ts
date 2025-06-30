import express from 'express';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { auth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';

const router = express.Router();

// Follow a user
router.post('/:slug', auth, async (req: AuthRequest, res) => {
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

    // Update follower count
    const followerCount = await Follow.countDocuments({ followingId: targetUser._id });
    await User.findByIdAndUpdate(targetUser._id, {
      'stats.followers': followerCount
    });

    // Update following count for current user
    const followingCount = await Follow.countDocuments({ followerId });
    await User.findByIdAndUpdate(followerId, {
      'stats.following': followingCount
    });

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
router.delete('/:slug', auth, async (req: AuthRequest, res) => {
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

    // Update follower count
    const followerCount = await Follow.countDocuments({ followingId: targetUser._id });
    await User.findByIdAndUpdate(targetUser._id, {
      'stats.followers': followerCount
    });

    // Update following count for current user
    const followingCount = await Follow.countDocuments({ followerId });
    await User.findByIdAndUpdate(followerId, {
      'stats.following': followingCount
    });

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
router.get('/:slug/followers', async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 20, offset = 0 } = req.query;

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
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

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
router.get('/:slug/following', async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 20, offset = 0 } = req.query;

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
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

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
router.get('/:slug/status', auth, async (req: AuthRequest, res) => {
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

export default router;