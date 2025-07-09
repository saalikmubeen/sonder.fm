import express from 'express';
import { User } from '../models/User';
import { Bookmark, BookmarkDocument } from '../models/Bookmark';
import { auth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';
import { ActivityLogger } from '../utils/activityLogger';

const router = express.Router();

// Create a bookmark
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const { trackId, timestampMs,  durationMs,  caption, metadata } = req.body;
    const userId = req.userId!;

    if (!trackId || timestampMs === undefined || !metadata || !durationMs) {
      return res.status(400).json({
        success: false,
        error: 'Track ID, timestamp, and metadata are required'
      });
    }

    if (timestampMs < 0) {
      return res.status(400).json({
        success: false,
        error: 'Timestamp must be non-negative'
      });
    }

    if (caption && caption.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Caption must be 500 characters or less'
      });
    }

    // Check if bookmark already exists for this exact moment
    const existingBookmark = await Bookmark.findOne({
      userId,
      trackId,
      timestampMs,
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        error: 'You have already bookmarked this exact moment'
      });
    }

    // Create bookmark
    const bookmark = new Bookmark({
      userId,
      trackId,
      timestampMs,
      durationMs,
      caption: caption?.trim(),
      metadata
    });

    await bookmark.save();

    // Log activity
    ActivityLogger.bookmark(
      userId,
      trackId,
      metadata.name,
      metadata.artists.map((a: any) => a.name).join(', '),
      metadata.album.imageUrl,
      timestampMs,
      caption
    );

    res.json({
      success: true,
      message: 'Bookmark created successfully',
      data: { bookmark }
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bookmark'
    });
  }
});

// Get bookmarks for a user by slug
router.get('/:slug', async (req, res) => {
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

    // Get bookmarks
    const bookmarks = await Bookmark.find({ userId: targetUser._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const response: APIResponse<{ bookmarks: any[] }> = {
      success: true,
      data: { bookmarks }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookmarks'
    });
  }
});

// Get current user's bookmarks
router.get('/my/bookmarks', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 20, offset = 0 } = req.query;

    const bookmarks = await Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const response: APIResponse<{ bookmarks: any[] }> = {
      success: true,
      data: { bookmarks }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your bookmarks'
    });
  }
});

// Delete bookmark (only by owner)
router.delete('/:bookmarkId', auth, async (req: AuthRequest, res) => {
  try {
    const { bookmarkId } = req.params;
    const userId = req.userId!;

    // Find bookmark first, then delete it
    const bookmark = await Bookmark.findOne({
      _id: bookmarkId,
      userId
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found or you are not authorized to delete it'
      });
    }

    // Delete the bookmark
    await Bookmark.findOneAndDelete({
      _id: bookmarkId,
      userId
    });

    // Log activity
    ActivityLogger.bookmarkDelete(
      userId,
      bookmark.trackId,
      bookmark.metadata.name,
      bookmark.metadata.artists.map((a: any) => a.name).join(', ')
    );

    res.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bookmark'
    });
  }
});

// Update bookmark caption
router.put('/:bookmarkId', auth, async (req: AuthRequest, res) => {
  try {
    const { bookmarkId } = req.params;
    const { caption } = req.body;
    const userId = req.userId!;

    if (caption && caption.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Caption must be 500 characters or less'
      });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: bookmarkId, userId },
      { caption: caption?.trim() },
      { new: true }
    );

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found or you are not authorized to update it'
      });
    }

    res.json({
      success: true,
      message: 'Bookmark updated successfully',
      data: { bookmark }
    });
  } catch (error) {
    console.error('Error updating bookmark:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bookmark'
    });
  }
});

export default router;