import express from 'express';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { auth, AuthRequest } from '../middleware/auth';
import type { APIResponse, FeedItem } from '@sonder/types';

const router = express.Router();

// Get user's personalized feed
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 20, offset = 0 } = req.query;

    // Get users that the current user follows
    const following = await Follow.find({ followerId: userId })
      .populate(
        'followingId',
        'displayName avatarUrl publicSlug profileTheme vibeSummary cachedNowPlaying cachedUpdatedAt'
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    // Transform to feed items
    const feedItems: FeedItem[] = following
      .map((follow) => {
        const user = follow.followingId as any;
        if (!user || !user.cachedNowPlaying) return null;

        return {
          user: {
            _id: user._id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            publicSlug: user.publicSlug,
            profileTheme: user.profileTheme,
            vibeSummary: user.vibeSummary,
          },
          nowPlaying: user.cachedNowPlaying,
          timestamp: user.cachedUpdatedAt || new Date(),
        };
      })
      .filter(Boolean) as FeedItem[];

    // Sort by most recent activity
    feedItems.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    );

    const response: APIResponse<{ feed: FeedItem[] }> = {
      success: true,
      data: { feed: feedItems },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed',
    });
  }
});

// Get discover feed (users with similar music taste)
router.get('/discover', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 10 } = req.query;

    // Get current user's top genres
    const currentUser = await User.findById(userId).select(
      'stats.topGenres topArtists'
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Find users with similar genres or artists (excluding current user and already followed)
    const followedUsers = await Follow.find({
      followerId: userId,
    }).select('followingId');
    const followedIds = followedUsers.map((f) => f.followingId);
    followedIds.push(userId as any); // Exclude self

    const similarUsers = await User.find({
      _id: { $nin: followedIds },
      // $or: [
      //   { 'stats.topGenres': { $in: currentUser.stats.topGenres } },
      //   { topArtists: { $in: currentUser.topArtists } }
      // ]
    })
      .select(
        'displayName avatarUrl publicSlug profileTheme vibeSummary cachedNowPlaying stats'
      )
      .limit(parseInt(limit as string))
      .sort({ 'stats.followers': -1 });

    const response: APIResponse<{ users: any[] }> = {
      success: true,
      data: { users: similarUsers },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching discover feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch discover feed',
    });
  }
});

// Get trending users (most followed recently)
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get users with most followers and recent activity
    const trendingUsers = await User.find({
      cachedUpdatedAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }, // Last 24 hours
    })
      .select(
        'displayName avatarUrl publicSlug profileTheme vibeSummary cachedNowPlaying stats'
      )
      .sort({ 'stats.followers': -1, cachedUpdatedAt: -1 })
      .limit(parseInt(limit as string));

    const response: APIResponse<{ users: any[] }> = {
      success: true,
      data: { users: trendingUsers },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching trending users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending users',
    });
  }
});

export default router;
