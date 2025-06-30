import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message } from '../models/Message';
import { User } from '../models/User';
import type { ServerToClientEvents, ClientToServerEvents } from '@sonder/types';

const connectedUsers = new Map<string, string>(); // userId -> socketId

export const setupSocket = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error'));
      }

      (socket as any).userId = decoded.userId;
      (socket as any).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    console.log(`User ${userId} connected`);

    // Store connection
    connectedUsers.set(userId, socket.id);
    
    // Notify others that user is online
    socket.broadcast.emit('user_online', userId);

    // Join user to their own room
    socket.join(`user:${userId}`);

    // Handle joining conversation rooms
    socket.on('join_room', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;
        const senderId = userId;

        // Save message to database
        const message = new Message({
          senderId,
          receiverId,
          content,
          isRead: false
        });

        await message.save();
        await message.populate('senderId', 'displayName avatarUrl');

        // Send to receiver if they're online
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message_received', message.toObject());
        }

        // Send confirmation back to sender
        socket.emit('message_received', message.toObject());
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async (messageId: string) => {
      try {
        await Message.findByIdAndUpdate(messageId, { isRead: true });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing_start', {
        userId,
        conversationId
      });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing_stop', {
        userId,
        conversationId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      connectedUsers.delete(userId);
      socket.broadcast.emit('user_offline', userId);
    });
  });
};

export const getConnectedUsers = () => connectedUsers;