import express from 'express';
import { Activity } from '../models/Activity';
import { auth, AuthRequest } from '../middleware/auth';
import { Follow } from '../models/Follow';
import type { APIResponse } from '@sonder/types';

const router = express.Router();

// Get user's activity feed (their own activities + followed users' activities)
router.get('/feed', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 20, cursor, type } = req.query;

    // Get users that the current user follows
    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);
    
    // Include the user's own activities
    const actorIds = [...followingIds, userId];

    // Build query
    let query: any = { actorId: { $in: actorIds } };
    
    // Add type filter if specified
    if (type && typeof type === 'string') {
      query.type = type;
    }
    
    // Add cursor-based pagination
    if (cursor && typeof cursor === 'string') {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch activities
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    // Get next cursor
    const nextCursor = activities.length > 0 
      ? activities[activities.length - 1].createdAt.toISOString()
      : null;

    const response: APIResponse<{ activities: any[]; nextCursor: string | null }> = {
      success: true,
      data: {
        activities,
        nextCursor
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed'
    });
  }
});

// Get user's own activities
router.get('/me', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 20, cursor, type } = req.query;

    // Build query
    let query: any = { actorId: userId };
    
    // Add type filter if specified
    if (type && typeof type === 'string') {
      query.type = type;
    }
    
    // Add cursor-based pagination
    if (cursor && typeof cursor === 'string') {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch activities
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    // Get next cursor
    const nextCursor = activities.length > 0 
      ? activities[activities.length - 1].createdAt.toISOString()
      : null;

    const response: APIResponse<{ activities: any[]; nextCursor: string | null }> = {
      success: true,
      data: {
        activities,
        nextCursor
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activities'
    });
  }
});

// Get activity stats
router.get('/stats', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get activity counts by type
    const stats = await Activity.aggregate([
      { $match: { actorId: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const response: APIResponse<{ stats: any[] }> = {
      success: true,
      data: { stats }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity stats'
    });
  }
});

export default router;