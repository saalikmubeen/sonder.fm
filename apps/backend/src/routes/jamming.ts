import express from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { RoomManager } from '../models/JammingRoom';
import type { APIResponse } from '@sonder/types';
import { SpotifyAPI } from '@sonder/utils';
import { RoomSyncService } from '../services/roomSync';
import { v4 as uuidv4 } from 'uuid';
import { Room } from '../models/Room';
import { Tag } from '../models/Tag';

const router = express.Router();

const spotifyAPI = new SpotifyAPI(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  process.env.SPOTIFY_REDIRECT_URI!
);

// Create a new room (only through /jam page)
router.post('/rooms/create', auth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const roomId = uuidv4();
    const { name, tags = [] } = req.body;

    // Check if user is already hosting a room
    const userId = user._id.toString();
    const alreadyHosting = RoomManager.getAllRooms().some(room => room.hostId === userId);
    if (alreadyHosting) {
      return res.status(400).json({
        success: false,
        error: 'You are already hosting a jam. End your current jam before hosting a new one.',
      });
    }

    // Process and validate tags
    const processedTags = await processRoomTags(tags);

    // Create new room with current user as host
    const room = RoomManager.createRoom(roomId, {
      userId: user._id.toString(),
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      publicSlug: user.publicSlug,
      name: name
    });

    // Sync to database with tags
    await RoomSyncService.syncRoomToDatabase(roomId, name, processedTags);

    const response: APIResponse<{ room: any; isHost: boolean; roomId: string }> = {
      success: true,
      data: {
        room,
        isHost: true,
        roomId,
      },
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create room',
    });
  }
});

// Helper function to process and validate tags
async function processRoomTags(tags: string[]): Promise<string[]> {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  const processedTags: string[] = [];
  const maxTags = 5;

  for (const tag of tags.slice(0, maxTags)) {
    if (typeof tag !== 'string') continue;

    const cleanTag = tag.toLowerCase().trim();
    
    // Validate tag format
    if (!cleanTag || cleanTag.length > 20 || !/^[a-zA-Z0-9\s\-]+$/.test(cleanTag)) {
      continue;
    }

    processedTags.push(cleanTag);

    // Upsert tag in database
    try {
      await Tag.findOneAndUpdate(
        { name: cleanTag },
        { 
          $inc: { usageCount: 1 },
          $setOnInsert: { 
            name: cleanTag,
            category: 'custom'
          }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error upserting tag:', error);
    }
  }

  return [...new Set(processedTags)]; // Remove duplicates
}

// Get all tags for filtering
router.get('/tags', async (req, res) => {
  try {
    const tags = await Tag.find({})
      .sort({ usageCount: -1, name: 1 })
      .limit(50);

    const response: APIResponse<{ tags: any[] }> = {
      success: true,
      data: { tags }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
});

// Join an existing room (only if room exists)
router.post('/rooms/:roomId/join', auth, async (req: AuthRequest, res) => {
  console.log(`🟡 JOIN ENDPOINT HIT: ${req.params.roomId}`);
  try {
    const { roomId } = req.params;
    const user = req.user!;

    console.log(`=== JOIN ROOM REQUEST ===`);
    console.log(`User ${user.displayName} attempting to join room: ${roomId}`);
    console.log(`Current total rooms: ${RoomManager.getRoomCount()}`);
    console.log(`All room IDs:`, Array.from(RoomManager.getAllRooms().map(r => r.roomId)));

    // Check if room exists
    let room = RoomManager.getRoom(roomId);
    if (!room) {
      console.log(`Room ${roomId} not found for joining`);
      console.log(`Available rooms:`, RoomManager.getAllRooms().map(r => r.roomId));
      return res.status(404).json({
        success: false,
        error: 'Room not found. Rooms can only be created through the main jam page.',
      });
    }

    console.log(`Room ${roomId} found, adding ${user.displayName} to existing room`);
    console.log(`Room details before join:`, {
      roomId: room!.roomId,
      hostId: room!.hostId,
      hostName: room!.members.find(m => m.userId === room!.hostId)?.displayName,
      memberCount: room!.members.length
    });

    // Join existing room
    room = RoomManager.joinRoom(roomId, {
      userId: user._id.toString(),
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      publicSlug: user.publicSlug,
    });

    if (!room) {
      console.log(`Room ${roomId} disappeared during join process`);
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    console.log(`Room ${roomId} joined successfully`);
    console.log(`Room details after join:`, {
      roomId: room.roomId,
      hostId: room.hostId,
      hostName: room.members.find(m => m.userId === room.hostId)?.displayName,
      memberCount: room.members.length
    });

    // Sync to database
    await RoomSyncService.syncRoomToDatabase(roomId);

    const response: APIResponse<{ room: any; isHost: boolean }> = {
      success: true,
      data: {
        room,
        isHost: room.hostId === user._id.toString(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join room',
    });
  }
});

// Leave a room
router.post('/rooms/:roomId/leave', auth, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId!;

    const { room, roomEnded } = RoomManager.leaveRoom(roomId, userId);

    // Sync to database or cleanup
    if (roomEnded) {
      await RoomSyncService.cleanupRoom(roomId);
    } else {
      await RoomSyncService.syncRoomToDatabase(roomId);
    }

    res.json({
      success: true,
      data: { room, roomEnded },
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave room',
    });
  }
});



// Search for rooms by name
router.get('/rooms/search', auth, async (req: AuthRequest, res) => {
  console.log("helooooooooooo")
  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Room name is required' });
    }
    // Find active rooms with this name (lastActive within 15 minutes, at least 1 participant)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    let rooms = await Room.find({
      name,
      lastActive: { $gte: fifteenMinutesAgo },
      participants: { $ne: [] }
    })
      .populate('hostId', 'displayName avatarUrl publicSlug')
      .populate('participants', 'displayName avatarUrl publicSlug')
      .sort({ lastActive: -1 });


    const currentRooms = RoomManager.getRoomsMap();

    // only those rooms which are currently active and not deleted.
    rooms = rooms.filter((room) => {
      return currentRooms.has(room.roomId);
    })

    // Return metadata for each room
    const result = rooms.map((room: any) => ({
      roomId: room.roomId,
      name: room.name,
      host: room.hostId,
      participantCount: room.participants.length,
      createdAt: room.createdAt,
      lastActive: room.lastActive,
    }));

    res.json({ success: true, data: { rooms: result } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search rooms' });
  }
});



// Get room info
router.get('/rooms/:roomId', auth, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId!;

    const room = RoomManager.getRoom(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    const isHost = room.hostId === userId;
    const isMember = room.members.some(m => m.userId === userId);

    const response: APIResponse<{ room: any; isHost: boolean; isMember: boolean }> = {
      success: true,
      data: { room, isHost, isMember },
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room',
    });
  }
});

// Host controls - play track
router.post('/rooms/:roomId/play', auth, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const { trackId, positionMs = 0 } = req.body;
    console.log("Body:")
    console.log(req.body)
    const user = req.user!;

    const room = RoomManager.getRoom(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    if (room.hostId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the host can control playback',
      });
    }

    // Get track info from Spotify if trackId provided
    if (trackId) {
      try {
        const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });

        if (trackResponse.ok) {
          const trackData = await trackResponse.json() as {
            id: string;
            name: string;
            artists: Array<{ name: string }>;
            album: { name: string; images: Array<{ url: string }> };
            external_urls: { spotify: string };
            duration_ms: number;
          };
          const track = {
            id: trackData.id,
            name: trackData.name,
            artist: trackData.artists.map((a: any) => a.name).join(', '),
            album: trackData.album.name,
            albumArt: trackData.album.images[0]?.url || '',
            spotifyUrl: trackData.external_urls.spotify,
            durationMs: trackData.duration_ms,
          };

          // Update room state
          RoomManager.setCurrentTrack(roomId, track);
        }
      } catch (error) {
        console.error('Error fetching track info:', error);
      }
    }

    // Update room state
    RoomManager.updatePlaybackState(roomId, {
      isPlaying: true,
      positionMs,
    });

    // Add to song history if this is a new track
    if (trackId && room) {
      const updatedRoom = RoomManager.getRoom(roomId);
      if (updatedRoom?.currentTrack) {
        await RoomSyncService.addSongToHistory(roomId, updatedRoom.currentTrack, user.spotifyId);
      }
    }

    // Sync room state to database
    await RoomSyncService.syncRoomToDatabase(roomId);

    // Control Spotify playback from backend
    console.log(user.accessToken, positionMs, trackId)
    try {
      const playResponse = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: trackId ? [`spotify:track:${trackId}`] : undefined,
          position_ms: positionMs,
        }),
      });

      if (!playResponse.ok) {
        const errorText = await playResponse.text();
        console.error('Spotify play API error:', playResponse.status, errorText);
        return res.status(playResponse.status).json({
          success: false,
          error: `Spotify API error: ${playResponse.status}`,
        });
      }
    } catch (error) {
      console.error('Error controlling Spotify playback:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to control Spotify playback',
      });
    }

    // Broadcast to all room members
    const updatedRoom = RoomManager.getRoom(roomId);
    if (updatedRoom) {
      // Emit to socket if available
      const io = req.app.get('io');
      if (io) {
        io.of('/jamming').to(roomId).emit('playback_play', {
          trackId,
          positionMs,
          timestamp: Date.now(),
        });
      }
    }

    res.json({
      success: true,
      data: { room: updatedRoom },
    });
  } catch (error) {
    console.error('Error in play endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to play track',
    });
  }
});

// Host controls - pause track
router.post('/rooms/:roomId/pause', auth, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const user = req.user!;



    const room = RoomManager.getRoom(roomId);
    console.log(room)

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    if (room.hostId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the host can control playback',
      });
    }

    // Update room state
    RoomManager.updatePlaybackState(roomId, {
      isPlaying: false,
    });

    // Control Spotify playback from backend
    try {
      const pauseResponse = await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pauseResponse.ok) {
        const errorText = await pauseResponse.text();
        console.error('Spotify pause API error:', pauseResponse.status, errorText);
        return res.status(pauseResponse.status).json({
          success: false,
          error: `Spotify API error: ${pauseResponse.status}`,
        });
      }
    } catch (error) {
      console.error('Error controlling Spotify playback:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to control Spotify playback',
      });
    }

    // Broadcast to all room members
    const updatedRoom = RoomManager.getRoom(roomId);
    if (updatedRoom) {
      // Emit to socket if available
      const io = req.app.get('io');
      if (io) {
        io.of('/jamming').to(roomId).emit('playback_pause', {
          timestamp: Date.now(),
        });
      }
    }

    res.json({
      success: true,
      data: { room: updatedRoom },
    });
  } catch (error) {
    console.error('Error in pause endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause track',
    });
  }
});

// Host controls - seek track
router.post('/rooms/:roomId/seek', auth, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const { positionMs = 0 } = req.body;
    const user = req.user!;

    const room = RoomManager.getRoom(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    if (room.hostId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the host can control playback',
      });
    }

    // Update room state
    RoomManager.updatePlaybackState(roomId, {
      positionMs,
    });

    // Control Spotify playback from backend
    try {
      const seekResponse = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!seekResponse.ok) {
        const errorText = await seekResponse.text();
        console.error('Spotify seek API error:', seekResponse.status, errorText);
        return res.status(seekResponse.status).json({
          success: false,
          error: `Spotify API error: ${seekResponse.status}`,
        });
      }
    } catch (error) {
      console.error('Error controlling Spotify playback:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to control Spotify playback',
      });
    }

    // Broadcast to all room members
    const updatedRoom = RoomManager.getRoom(roomId);
    if (updatedRoom) {
      // Emit to socket if available
      const io = req.app.get('io');
      if (io) {
        io.of('/jamming').to(roomId).emit('playback_seek', {
          positionMs,
          timestamp: Date.now(),
        });
      }
    }

    res.json({
      success: true,
      data: { room: updatedRoom },
    });
  } catch (error) {
    console.error('Error in seek endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seek track',
    });
  }
});

// Search tracks for host
router.get('/search/tracks', auth, async (req: AuthRequest, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const user = req.user!;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q as string)}&type=track&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search tracks');
    }

    const data = await response.json() as {
      tracks: {
        items: Array<{
          id: string;
          name: string;
          artists: Array<{ name: string }>;
          album: { name: string; images: Array<{ url: string }> };
          external_urls: { spotify: string };
          duration_ms: number;
        }>;
      };
    };

    const tracks = data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || '',
      spotifyUrl: track.external_urls.spotify,
      durationMs: track.duration_ms,
    }));

    res.json({
      success: true,
      data: { tracks },
    });
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search tracks',
    });
  }
});

// Check for active Spotify devices
router.get('/rooms/:roomId/devices', auth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
      },
    });
    const devices = await devicesResponse.json();
    res.status(devicesResponse.status).json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});



export default router;