import express from 'express';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { auth, AuthRequest } from '../middleware/auth';
import type { APIResponse } from '@sonder/types';

const router = express.Router();

// Send a message
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId!;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID and content are required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message must be 1000 characters or less'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }

    // Create message
    const message = new Message({
      senderId,
      receiverId,
      content: content.trim(),
      isRead: false
    });

    await message.save();
    await message.populate('senderId', 'displayName avatarUrl');
    await message.populate('receiverId', 'displayName avatarUrl');

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get messages between two users
router.get('/:userId', auth, async (req: AuthRequest, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.userId!;
    const { limit = 50, offset = 0 } = req.query;

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    })
    .populate('senderId', 'displayName avatarUrl')
    .populate('receiverId', 'displayName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string))
    .skip(parseInt(offset as string));

    // Mark messages as read (messages sent to current user)
    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false
      },
      { isRead: true }
    );

    const response: APIResponse<{ messages: any[] }> = {
      success: true,
      data: { messages: messages.reverse() } // Reverse to show oldest first
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Get user's conversations
router.get('/conversations', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            displayName: '$user.displayName',
            avatarUrl: '$user.avatarUrl',
            publicSlug: '$user.publicSlug'
          },
          lastMessage: '$lastMessage',
          unreadCount: '$unreadCount'
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    const response: APIResponse<{ conversations: any[] }> = {
      success: true,
      data: { conversations }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;

    // Update message if current user is the receiver
    const result = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiverId: userId,
        isRead: false
      },
      { isRead: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or already read'
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read'
    });
  }
});

// Delete message (only sender can delete)
router.delete('/:messageId', auth, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;

    const result = await Message.findOneAndDelete({
      _id: messageId,
      senderId: userId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or you are not authorized to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

export default router;