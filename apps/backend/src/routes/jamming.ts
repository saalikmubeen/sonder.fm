import express from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { RoomManager } from '../models/JammingRoom';
import type { APIResponse } from '@sonder/types';
import { SpotifyAPI } from '@sonder/utils';

const router = express.Router();

const spotifyAPI = new SpotifyAPI(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  process.env.SPOTIFY_REDIRECT_URI!
);

// Create a new room (only through /jam page)
router.post('/rooms/:roomId/create', auth, async (req: AuthRequest, res) => {
  console.log(`🔵 CREATE ENDPOINT HIT: ${req.params.roomId}`);
  try {
    const { roomId } = req.params;
    const user = req.user!;

    console.log(`=== CREATE ROOM REQUEST ===`);
    console.log(`Creating room: ${roomId} for user: ${user.displayName}`);
    console.log(`Current total rooms: ${RoomManager.getRoomCount()}`);

    // Check if room already exists
    const existingRoom = RoomManager.getRoom(roomId);
    if (existingRoom) {
      console.log(`Room ${roomId} already exists`);
      return res.status(400).json({
        success: false,
        error: 'Room already exists. Use join endpoint instead.',
      });
    }

    // Create new room with current user as host
    const room = RoomManager.createRoom(roomId, {
      userId: user._id.toString(),
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      publicSlug: user.publicSlug,
    });

    console.log(`Room ${roomId} created successfully with ${room.members.length} members`);
    console.log(`Total rooms after creation: ${RoomManager.getRoomCount()}`);
    console.log(`Room details:`, {
      roomId: room.roomId,
      hostId: room.hostId,
      hostName: room.members.find(m => m.userId === room.hostId)?.displayName,
      memberCount: room.members.length
    });

    const response: APIResponse<{ room: any; isHost: boolean }> = {
      success: true,
      data: {
        room,
        isHost: true,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room',
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