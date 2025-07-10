import express from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { Room } from '../models/Room';
import { RoomSyncService } from '../services/roomSync';
import { RoomManager } from '../models/JammingRoom';
import { User } from '../models/User';
import type { APIResponse } from '@sonder/types';
import { ActivityLogger } from '../utils/activityLogger';

const router = express.Router();

// Get active rooms for discovery
router.get('/discover', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { filter, search, tags } = req.query;

    let rooms;
    const tagFilters = tags
      ? (tags as string).split(',').map((t) => t.trim().toLowerCase())
      : [];

    if (search && typeof search === 'string') {
      // Search functionality
      rooms = await RoomSyncService.searchRooms(
        search,
        userId,
        true,
        tagFilters
      );
    } else if (tagFilters.length > 0) {
      // Filter by tags
      rooms = await RoomSyncService.getRoomsByTags(
        tagFilters,
        userId
      );
    } else {
      // Regular discovery
      rooms = await RoomSyncService.getActiveRooms(userId);
    }

    // Filter by friends if requested
    if (filter === 'friends') {
      rooms = rooms.filter((room) => room.hasFriends);
    }

    const response: APIResponse<{ rooms: any[] }> = {
      success: true,
      data: { rooms },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching discovery rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms',
    });
  }
});

// Get recently ended rooms
router.get('/recent', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { search, tags } = req.query;

    let rooms;
    const tagFilters = tags
      ? (tags as string).split(',').map((t) => t.trim().toLowerCase())
      : [];

    if (search && typeof search === 'string') {
      // Search in recent rooms
      rooms = await RoomSyncService.searchRooms(
        search,
        userId,
        false,
        tagFilters
      );
    } else if (tagFilters.length > 0) {
      // Filter recent rooms by tags
      rooms = await RoomSyncService.getRecentRoomsByTags(
        tagFilters,
        userId
      );
    } else {
      // Get recently ended rooms
      rooms = await RoomSyncService.getRecentlyEndedRooms(userId);
    }

    const response: APIResponse<{ rooms: any[] }> = {
      success: true,
      data: { rooms },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching recent rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent rooms',
    });
  }
});

// Get room history
router.get(
  '/:roomId/history',
  auth,
  async (req: AuthRequest, res) => {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const room = await Room.findOne({ roomId }).populate(
        'songHistory.playedBy',
        'displayName avatarUrl publicSlug'
      );

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
        });
      }

      // Get history in reverse chronological order
      const history = room.songHistory
        .reverse()
        .slice(
          parseInt(offset as string),
          parseInt(offset as string) + parseInt(limit as string)
        );

      const response: APIResponse<{ history: any[] }> = {
        success: true,
        data: { history },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching room history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch room history',
      });
    }
  }
);

// Export room history to Spotify playlist
router.post(
  '/:roomId/export-playlist',
  auth,
  async (req: AuthRequest, res) => {
    try {
      const { roomId } = req.params;
      const { name, description } = req.body;
      const user = req.user!;

      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
        });
      }

      if (room.songHistory.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No songs in room history to export',
        });
      }

      // Create playlist on Spotify
      const playlistName = name || `${room.name} - Sonder.fm`;
      const playlistDescription =
        description ||
        `Exported from Sonder.fm room "${
          room.name
        }" on ${new Date().toLocaleDateString()}`;

      const createPlaylistResponse = await fetch(
        `https://api.spotify.com/v1/users/${user.spotifyId}/playlists`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: playlistName,
            description: playlistDescription,
            public: false,
          }),
        }
      );

      if (!createPlaylistResponse.ok) {
        throw new Error('Failed to create Spotify playlist');
      }

      const playlist: any = await createPlaylistResponse.json();

      // Add tracks to playlist in batches of 100
      const trackUris = room.songHistory.map(
        (song) => `spotify:track:${song.trackId}`
      );
      const batchSize = 100;

      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);

        const addTracksResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uris: batch,
            }),
          }
        );

        if (!addTracksResponse.ok) {
          console.error(
            'Failed to add tracks to playlist:',
            await addTracksResponse.text()
          );
        }
      }

      // Log activity
      ActivityLogger.playlistExport(
        user._id.toString(),
        roomId,
        room.name,
        playlistName,
        room.songHistory.length
      );

      const response: APIResponse<{ playlist: any }> = {
        success: true,
        data: {
          playlist: {
            id: playlist.id,
            name: playlist.name,
            url: playlist.external_urls.spotify,
            image: playlist.images?.[0]?.url,
            trackCount: room.songHistory.length,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error exporting playlist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export playlist',
      });
    }
  }
);

// Get room details for discovery
router.get(
  '/:roomId/details',
  auth,
  async (req: AuthRequest, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.userId;

      const room = await Room.findOne({ roomId })
        .populate('hostId', 'displayName avatarUrl publicSlug')
        .populate('participants', 'displayName avatarUrl publicSlug');

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
        });
      }

      const memoryRoom = RoomManager.getRoom(roomId);
      const isActive = !!memoryRoom;
      const currentTrack =
        memoryRoom?.currentTrack || room.currentTrack;

      // Check if user has friends in room
      let hasFriends = false;
      if (userId) {
        const user = await User.findById(userId);
        if (user && (user as any).following) {
          const followingIds: string[] = (user as any).following.map(
            (id: any) => id.toString()
          );
          hasFriends = room.participants.some((p: any) =>
            followingIds.includes(p._id.toString())
          );
        }
      }

      const response: APIResponse<{ room: any }> = {
        success: true,
        data: {
          room: {
            roomId: room.roomId,
            name: room.name,
            host: room.hostId,
            participants: room.participants,
            participantCount:
              memoryRoom?.members.length || room.participants.length,
            currentTrack,
            isActive,
            hasFriends,
            lastActive: room.lastActive,
            createdAt: room.createdAt,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching room details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch room details',
      });
    }
  }
);

export default router;
