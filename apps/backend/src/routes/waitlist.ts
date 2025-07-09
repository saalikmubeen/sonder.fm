import express from 'express';
import { body, validationResult } from 'express-validator';
import { WaitlistEntry } from '../models/WaitlistEntry';
import { auth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';
import rateLimit from 'express-rate-limit';
import { emailService } from '../services/emailService';

const router = express.Router();

// Rate limiting for waitlist submissions
const waitlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: 'Too many waitlist submissions. Please try again later.'
  }
});

// Validation middleware
const validateWaitlistEntry = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('referrer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Invalid referral code')
];

// Join waitlist
router.post(
  '/',
  waitlistLimiter,
  validateWaitlistEntry,
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, name, referrer } = req.body;

    // Check if email already exists
    const existingEntry = await WaitlistEntry.findOne({ email });
    if (existingEntry) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered on waitlist',
        data: {
          position: existingEntry.position,
          referralCode: existingEntry.referralCode
        }
      });
    }

    // Find referrer if provided
    let referredBy = null;
    if (referrer) {
      const referrerEntry = await WaitlistEntry.findOne({ referralCode: referrer });
      if (referrerEntry) {
        referredBy = referrerEntry._id;
      }
    }

    // Get next position
    const lastEntry = await WaitlistEntry.findOne().sort({ position: -1 });
    const position = (lastEntry?.position || 0) + 1;

    // Generate unique referral code
    const referralCode = await (WaitlistEntry as any).generateReferralCode();

    // Create waitlist entry
    const waitlistEntry = new WaitlistEntry({
      email,
      name: name?.trim(),
      referralCode,
      referredBy,
      position
    });

    await waitlistEntry.save();

    // Send confirmation email
    try {
      await emailService.sendWaitlistConfirmation(email, name, position, referralCode);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    const response: APIResponse<{
      position: number;
      referralCode: string;
      totalCount: number;
    }> = {
      success: true,
      message: 'Successfully joined the waitlist!',
      data: {
        position,
        referralCode,
        totalCount: await WaitlistEntry.countDocuments()
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error joining waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join waitlist. Please try again.'
    });
  }
});

// Get waitlist count
router.get('/count', async (req, res) => {
  try {
    const totalCount = await WaitlistEntry.countDocuments();
    const pendingCount = await WaitlistEntry.countDocuments({ status: 'pending' });

    const response: APIResponse<{
      total: number;
      pending: number;
    }> = {
      success: true,
      data: {
        total: totalCount,
        pending: pendingCount
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get waitlist count'
    });
  }
});

// Get referral stats
router.get('/referrals/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const referrer = await WaitlistEntry.findOne({ referralCode: code });
    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Referral code not found'
      });
    }

    const referralCount = await WaitlistEntry.countDocuments({ referredBy: referrer._id });

    const response: APIResponse<{
      referralCount: number;
      position: number;
      name?: string;
    }> = {
      success: true,
      data: {
        referralCount,
        position: referrer.position,
        name: referrer.name
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral stats'
    });
  }
});

// Admin: Export waitlist (requires auth)
router.get('/export', auth, async (req: AuthRequest, res) => {
  try {
    // Simple admin check - you might want to implement proper admin roles
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(req.user?.email)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const entries = await WaitlistEntry.find()
      .populate('referredBy', 'email name referralCode')
      .sort({ position: 1 });

    const response: APIResponse<any[]> = {
      success: true,
      data: entries
    };

    res.json(response);
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export waitlist'
    });
  }
});

// Admin: Update entry status
router.patch('/:id/status', auth, async (req: AuthRequest, res) => {
  try {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(req.user?.email)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'invited', 'joined'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const entry = await WaitlistEntry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Waitlist entry not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error updating waitlist entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update waitlist entry'
    });
  }
});

export default router;