import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { RoomManager } from '../models/JammingRoom';
import { RoomSyncService } from './roomSync';
import { ActivityLogger } from '../utils/activityLogger';

interface JammingSocketData {
  userId: string;
  user: any;
  currentRoom?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  message: string;
  timestamp: Date;
}

export const setupJammingSocket = (io: Server) => {
  const jammingNamespace = io.of('/jamming');
  const activeConnections = new Map<string, Set<string>>(); // roomId -> Set of userIds
  const roomChats = new Map<string, ChatMessage[]>(); // roomId -> ChatMessage[]

  jammingNamespace.use(async (socket, next) => {
    try {
      console.log("Jamming socket use", socket.handshake.auth)
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
      console.error("Error in jamming socket use", error)
      next(new Error('Authentication error'));
    }
  });

  jammingNamespace.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const user = (socket as any).user;

    console.log(`User ${user.displayName} connected to jamming`);

    // Join a room
    socket.on('join_room', (roomId: string) => {
      console.log(`User ${user.displayName} joining room ${roomId}`);

      // Leave previous room if any (but not if it's the same room)
      if ((socket as any).currentRoom && (socket as any).currentRoom !== roomId) {
        console.log(`User ${user.displayName} leaving previous room ${(socket as any).currentRoom} to join ${roomId}`);
        socket.leave((socket as any).currentRoom);
        const prevRoomId = (socket as any).currentRoom;

        // Remove from active connections
        if (activeConnections.has(prevRoomId)) {
          activeConnections.get(prevRoomId)!.delete(userId);
          if (activeConnections.get(prevRoomId)!.size === 0) {
            activeConnections.delete(prevRoomId);
            // Clean up chat history when room is empty
            roomChats.delete(prevRoomId);
          }
        }

        jammingNamespace.to(prevRoomId).emit('user_left', {
          userId,
          displayName: user.displayName,
        });
      } else if ((socket as any).currentRoom === roomId) {
        console.log(`User ${user.displayName} already in room ${roomId}, not leaving`);
      }

      // Join new room
      socket.join(roomId);
      (socket as any).currentRoom = roomId;

      // Add to active connections
      if (!activeConnections.has(roomId)) {
        activeConnections.set(roomId, new Set());
      }
      activeConnections.get(roomId)!.add(userId);

      // Initialize chat history for room if it doesn't exist
      if (!roomChats.has(roomId)) {
        roomChats.set(roomId, []);
      }

      // Send existing chat history to the user
      const chatHistory = roomChats.get(roomId) || [];
      socket.emit('chat_history', chatHistory);

      // Notify others in the room
      socket.to(roomId).emit('user_joined', {
        userId,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        publicSlug: user.publicSlug,
      });

      // Join the room in RoomManager (ensures member has publicSlug)
      const room = RoomManager.joinRoom(roomId, {
        userId: user._id.toString(),
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        publicSlug: user.publicSlug,
      });
      if (room) {
        // Sync to database
        RoomSyncService.syncRoomToDatabase(roomId);

        socket.emit('room_state', room);
        // Broadcast full updated room state to all members
        jammingNamespace.to(roomId).emit('room_state', room);
      }
    });

    // Handle chat messages
    socket.on('send_chat_message', (data: { roomId: string; message: string }) => {
      const { roomId, message } = data;

      // Validate message
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        socket.emit('chat_error', { error: 'Message cannot be empty' });
        return;
      }

      if (message.length > 500) {
        socket.emit('chat_error', { error: 'Message too long (max 500 characters)' });
        return;
      }

      // Check if user is in the room
      if ((socket as any).currentRoom !== roomId) {
        socket.emit('chat_error', { error: 'You are not in this room' });
        return;
      }

      // Create chat message
      const chatMessage: ChatMessage = {
        id: `${Date.now()}-${userId}`,
        userId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        message: message.trim(),
        timestamp: new Date(),
      };

      // Add to room chat history
      if (!roomChats.has(roomId)) {
        roomChats.set(roomId, []);
      }
      const chatHistory = roomChats.get(roomId)!;
      chatHistory.push(chatMessage);

      // Keep only last 100 messages to prevent memory issues
      if (chatHistory.length > 100) {
        chatHistory.shift();
      }

      // Broadcast message to all users in the room
      jammingNamespace.to(roomId).emit('chat_message', chatMessage);

      console.log(`Chat message from ${user.displayName} in room ${roomId}: ${message}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (roomId: string) => {
      if ((socket as any).currentRoom === roomId) {
        socket.to(roomId).emit('user_typing', {
          userId,
          displayName: user.displayName,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', (roomId: string) => {
      if ((socket as any).currentRoom === roomId) {
        socket.to(roomId).emit('user_typing', {
          userId,
          displayName: user.displayName,
          isTyping: false,
        });
      }
    });

    // Leave room
    socket.on('leave_room', (roomId: string) => {
      console.log(`User ${user.displayName} leaving room ${roomId}`);

      socket.leave(roomId);
      (socket as any).currentRoom = undefined;

      // Remove from active connections
      if (activeConnections.has(roomId)) {
        activeConnections.get(roomId)!.delete(userId);
        if (activeConnections.get(roomId)!.size === 0) {
          activeConnections.delete(roomId);
          // Clean up chat history when room is empty
          roomChats.delete(roomId);
          console.log(`Cleaned up chat history for empty room ${roomId}`);
        }
      }

      // Update room state
      const { room, roomEnded } = RoomManager.leaveRoom(roomId, userId);

      // Sync to database or cleanup
      if (roomEnded) {
        RoomSyncService.cleanupRoom(roomId);
      } else if (room) {
        RoomSyncService.syncRoomToDatabase(roomId);
      }

      if (roomEnded) {
        // Notify all users that room ended
        jammingNamespace.to(roomId).emit('room_ended');
        // Clean up chat history
        roomChats.delete(roomId);
        console.log(`Room ${roomId} ended, chat history cleaned up`);
      } else {
        // Notify others that user left
        jammingNamespace.to(roomId).emit('user_left', {
          userId,
          displayName: user.displayName,
        });

        // Send updated room state
        if (room) {
          jammingNamespace.to(roomId).emit('room_state', room);
        }
      }
    });

    // Host playback controls
    socket.on('host_play', async (data: { roomId: string; trackId?: string; positionMs: number }) => {
      console.log("Host requested playback", data)
      const { roomId, trackId } = data;
      const room = RoomManager.getRoom(roomId);

      if (!room || room.hostId !== userId) {
        socket.emit('error', { message: 'Not authorized to control playback' });
        return;
      }

      // if (!room) {
      //   socket.emit('error', { message: 'Room not found' });
      //   return;
      // }

      // Fetch track info from Spotify and update currentTrack
      let track = null;
      if (trackId) {
        try {
          const userAccessToken = user.accessToken;
          const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`,
            { headers: { Authorization: `Bearer ${userAccessToken}` } });
          if (res.ok) {
            const trackData = await res.json() as any;
            track = {
              id: trackData.id,
              name: trackData.name,
              artist: trackData.artists.map((a: any) => a.name).join(', '),
              album: trackData.album.name,
              albumArt: trackData.album.images[0]?.url || '',
              spotifyUrl: trackData.external_urls.spotify,
              durationMs: trackData.duration_ms,
            };
            RoomManager.setCurrentTrack(roomId, track);
          }
        } catch (err) {
          console.error('Failed to fetch track info from Spotify:', err);
        }
      }

      // Update room state
      RoomManager.updatePlaybackState(roomId, {
        isPlaying: true,
        positionMs: data.positionMs,
      });

      // Add to song history if this is a new track
      if (trackId) {
        const updatedRoom = RoomManager.getRoom(roomId);
        if (updatedRoom?.currentTrack) {
          await RoomSyncService.addSongToHistory(roomId, updatedRoom.currentTrack, user.spotifyId);

          // Log track play activity
          ActivityLogger.trackPlay(
            userId,
            roomId,
            updatedRoom.name,
            trackId,
            updatedRoom.currentTrack.name,
            updatedRoom.currentTrack.artist,
            updatedRoom.currentTrack.albumArt
          );
        }
      }

      // Sync room state to database
      RoomSyncService.syncRoomToDatabase(roomId);

      // Broadcast to all room members
      jammingNamespace.to(roomId).emit('playback_play', {
        trackId,
        positionMs: data.positionMs,
        timestamp: Date.now(),
      });

      // Broadcast updated room state (with currentTrack) to all clients
      const updatedRoom = RoomManager.getRoom(roomId);
      if (updatedRoom) {
        jammingNamespace.to(roomId).emit('room_state', updatedRoom);
      }

      console.log(`Host ${user.displayName} started playback in room ${roomId}`);
    });

    // Host pause controls
    socket.on('host_pause', (data: { roomId: string; positionMs: number }) => {
      const { roomId, positionMs } = data;
      console.log("Socket pause backend", data)
      const room = RoomManager.getRoom(roomId);
      if (!room || room.hostId !== userId) {
        socket.emit('error', { message: 'Not authorized to control playback' });
        return;
      }
      // Update playback state
      RoomManager.updatePlaybackState(roomId, {
        isPlaying: false,
        positionMs,
      });
      // Broadcast pause event to all clients
      jammingNamespace.to(roomId).emit('playback_pause', { positionMs });
      // Broadcast updated room state to all clients
      const updatedRoom = RoomManager.getRoom(roomId);
      if (updatedRoom) {
        jammingNamespace.to(roomId).emit('room_state', updatedRoom);
      }
    });

    // Host seek controls
    socket.on('host_seek', (data: { roomId: string; positionMs: number }) => {
      const { roomId, positionMs } = data;
      const room = RoomManager.getRoom(roomId);
      if (!room || room.hostId !== userId) {
        socket.emit('error', { message: 'Not authorized to control playback' });
        return;
      }
      // Update playback state
      RoomManager.updatePlaybackState(roomId, {
        positionMs,
      });
      // Broadcast seek event to all clients
      jammingNamespace.to(roomId).emit('playback_seek', { positionMs });
      // Broadcast updated room state to all clients
      const updatedRoom = RoomManager.getRoom(roomId);
      if (updatedRoom) {
        jammingNamespace.to(roomId).emit('room_state', updatedRoom);
      }
    });

    socket.on('host_track_change', (data: { roomId: string; track: any }) => {
      const { roomId, track } = data;
      const room = RoomManager.getRoom(roomId);

      if (!room || room.hostId !== userId) {
        socket.emit('error', { message: 'Not authorized to control playback' });
        return;
      }

      // Update room state
      RoomManager.setCurrentTrack(roomId, track);

      // Broadcast to all room members
      jammingNamespace.to(roomId).emit('track_changed', {
        track,
        timestamp: Date.now(),
      });

      console.log(`Host ${user.displayName} changed track in room ${roomId}`);
    });

    // Handle disconnect - clean up user from room
    socket.on('disconnect', () => {
      console.log(`User ${user.displayName} disconnected from jamming socket`);

      const currentRoom = (socket as any).currentRoom;
      if (currentRoom) {
        // Remove from active connections
        if (activeConnections.has(currentRoom)) {
          activeConnections.get(currentRoom)!.delete(userId);
          if (activeConnections.get(currentRoom)!.size === 0) {
            activeConnections.delete(currentRoom);
            // Clean up chat history when room is empty
            roomChats.delete(currentRoom);
            console.log(`Cleaned up chat history for empty room ${currentRoom} after disconnect`);
          }
        }

        // Update room state
        const { room, roomEnded } = RoomManager.leaveRoom(currentRoom, userId);

        // Sync to database or cleanup
        if (roomEnded) {
          RoomSyncService.cleanupRoom(currentRoom);
        } else if (room) {
          RoomSyncService.syncRoomToDatabase(currentRoom);
        }

        if (roomEnded) {
          // Notify all users that room ended
          jammingNamespace.to(currentRoom).emit('room_ended');
          // Clean up chat history
          roomChats.delete(currentRoom);
          console.log(`Room ${currentRoom} ended after host disconnect, chat history cleaned up`);
        } else {
          // Notify others that user left
          jammingNamespace.to(currentRoom).emit('user_left', {
            userId,
            displayName: user.displayName,
          });

          // Send updated room state
          if (room) {
            jammingNamespace.to(currentRoom).emit('room_state', room);
          }
        }
      }
    });
  });
};