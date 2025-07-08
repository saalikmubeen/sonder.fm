import express from 'express';
import { User } from '../models/User';
import { VibeNote } from '../models/VibeNote';
import { auth, optionalAuth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';

const router = express.Router();

// Add vibe note to a user's profile
router.post('/:slug', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const { note, isAnonymous = true } = req.body;
    const userId = req.userId;

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    if (note.length > 300) {
      return res.status(400).json({
        success: false,
        error: 'Note must be 300 characters or less'
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

    // Create vibe note
    const vibeNote = new VibeNote({
      targetUserId: targetUser._id,
      note: note.trim(),
      isAnonymous: isAnonymous || !userId, // Force anonymous if not authenticated
      authorId: (!isAnonymous && userId) ? userId : undefined
    });

    await vibeNote.save();

    // Populate author info if not anonymous
    await vibeNote.populate('authorId', 'displayName avatarUrl');

    res.json({
      success: true,
      message: 'Vibe note added successfully',
      data: {
        note: {
          ...vibeNote.toObject(),
          authorId: vibeNote.isAnonymous ? undefined : vibeNote.authorId
        }
      }
    });
  } catch (error) {
    console.error('Error adding vibe note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add vibe note'
    });
  }
});

// Get vibe notes for a user's profile
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

    // Get vibe notes
    const vibeNotes = await VibeNote.find({ targetUserId: targetUser._id })
      .populate('authorId', 'displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    // Filter out author info for anonymous notes
    const formattedNotes = vibeNotes.map(note => ({
      ...note.toObject(),
      authorId: note.isAnonymous ? undefined : note.authorId
    }));

    const response: APIResponse<{ notes: any[] }> = {
      success: true,
      data: { notes: formattedNotes }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching vibe notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vibe notes'
    });
  }
});

// Delete vibe note (by author or target user)
router.delete('/:noteId', auth, async (req: AuthRequest, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.userId!;

    // Find the note
    const note = await VibeNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Allow delete if user is author or target user
    if (
      (note.authorId && note.authorId.toString() === userId) ||
      (note.targetUserId && note.targetUserId.toString() === userId)
    ) {
      await note.deleteOne();
      return res.json({
        success: true,
        message: 'Vibe note deleted successfully'
      });
    }

    return res.status(403).json({
      success: false,
      error: 'You are not authorized to delete this note'
    });
  } catch (error) {
    console.error('Error deleting vibe note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vibe note'
    });
  }
});

// Get user's own vibe notes (notes they've written)
router.get('/my/notes', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 20, offset = 0 } = req.query;

    const vibeNotes = await VibeNote.find({ authorId: userId })
      .populate('targetUserId', 'displayName avatarUrl publicSlug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const response: APIResponse<{ notes: any[] }> = {
      success: true,
      data: { notes: vibeNotes }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your notes'
    });
  }
});

export default router;