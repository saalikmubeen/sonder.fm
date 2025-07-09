import express from 'express';
import { User } from '../models/User';
import { Reaction } from '../models/Reaction';
import { auth, optionalAuth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';
import { ActivityLogger } from '../utils/activityLogger';

const router = express.Router();

// Add reaction to a user's profile
router.post('/:slug', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const { emoji } = req.body;
    const userId = req.userId; // Optional for anonymous reactions

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Emoji is required'
      });
    }

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user already reacted with this emoji (if authenticated)
    if (userId) {
      const existingReaction = await Reaction.findOne({
        userId,
        targetUserId: targetUser._id,
        emoji
      });

      if (existingReaction) {
        return res.status(400).json({
          success: false,
          error: 'You have already reacted with this emoji'
        });
      }
    }

    // Create reaction
    const reaction = new Reaction({
      userId: userId || undefined, // undefined for anonymous
      targetUserId: targetUser._id,
      emoji
    });

    await reaction.save();

    // Get updated reaction counts
    const reactions = await Reaction.aggregate([
      { $match: { targetUserId: targetUser._id } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } }
    ]);

    const reactionCounts: { [emoji: string]: number } = {};
    reactions.forEach(r => {
      reactionCounts[r._id] = r.count;
    });

    // Log activity (only if authenticated)
    if (userId) {
      ActivityLogger.reaction(userId, targetUser._id.toString(), emoji);
    }

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: { reactions: reactionCounts }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reaction'
    });
  }
});

// Remove reaction from a user's profile
router.delete('/:slug', auth, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const { emoji } = req.body;
    const userId = req.userId!;

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Emoji is required'
      });
    }

    // Find target user
    const targetUser = await User.findOne({ publicSlug: slug });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove reaction
    const result = await Reaction.findOneAndDelete({
      userId,
      targetUserId: targetUser._id,
      emoji
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Reaction not found'
      });
    }

    // Get updated reaction counts
    const reactions = await Reaction.aggregate([
      { $match: { targetUserId: targetUser._id } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } }
    ]);

    const reactionCounts: { [emoji: string]: number } = {};
    reactions.forEach(r => {
      reactionCounts[r._id] = r.count;
    });

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: { reactions: reactionCounts }
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove reaction'
    });
  }
});

// Get reactions for a user's profile
router.get('/:slug', async (req, res) => {
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

    // Get reaction counts
    const reactions = await Reaction.aggregate([
      { $match: { targetUserId: targetUser._id } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } }
    ]);

    const reactionCounts: { [emoji: string]: number } = {};
    reactions.forEach(r => {
      reactionCounts[r._id] = r.count;
    });

    const response: APIResponse<{ reactions: { [emoji: string]: number } }> = {
      success: true,
      data: { reactions: reactionCounts }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reactions'
    });
  }
});

export default router;