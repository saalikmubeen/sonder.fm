import { Room } from '../models/Room';
import { RoomManager } from '../models/JammingRoom';
import { User } from '../models/User';
import { Follow } from '../models/Follow';

export class RoomSyncService {
  // Sync in-memory room to database
  static async syncRoomToDatabase(
    roomId: string,
    name?: string,
    tags?: string[],
    isPublic?: boolean
  ) {
    try {
      const memoryRoom = RoomManager.getRoom(roomId);
      if (!memoryRoom) return;

      // Find or create room in database
      let dbRoom = await Room.findOne({ roomId });

      if (!dbRoom) {
        // Create new room in database
        const host = await User.findOne({
          spotifyId: memoryRoom.hostSpotifyId,
        });
        if (!host) return;

        dbRoom = new Room({
          roomId: memoryRoom.roomId,
          name: name || roomId, // Use provided name or roomId as fallback
          hostId: host._id,
          hostSpotifyId: memoryRoom.hostSpotifyId,
          isPublic: isPublic,
          participants: [],
          tags: tags || [],
          currentTrack: memoryRoom.currentTrack,
          songHistory: [],
        });
      }

      // Update participants
      const participantIds = await Promise.all(
        memoryRoom.members.map(async (member) => {
          const user = await User.findOne({
            spotifyId: member.spotifyId,
          });
          return user?._id;
        })
      );

      dbRoom.participants = participantIds.filter(Boolean);
      dbRoom.currentTrack = memoryRoom.currentTrack;
      dbRoom.lastActive = new Date();

      // Update tags if provided
      if (tags) {
        dbRoom.tags = tags;
      }

      await dbRoom.save();
      return dbRoom;
    } catch (error) {
      console.error('Error syncing room to database:', error);
    }
  }

  // Add song to history when a new track is played
  static async addSongToHistory(
    roomId: string,
    trackInfo: any,
    playedBySpotifyId: string
  ) {
    try {
      const playedByUser = await User.findOne({
        spotifyId: playedBySpotifyId,
      });
      if (!playedByUser) return;

      const dbRoom = await Room.findOne({ roomId });
      if (!dbRoom) return;

      // Check if this is actually a new track (avoid duplicates)
      const lastSong =
        dbRoom.songHistory[dbRoom.songHistory.length - 1];
      if (lastSong && lastSong.trackId === trackInfo.id) {
        return; // Same track, don't add duplicate
      }

      const songEntry = {
        trackId: trackInfo.id,
        name: trackInfo.name,
        artist: trackInfo.artist,
        album: trackInfo.album,
        albumArt: trackInfo.albumArt,
        spotifyUrl: trackInfo.spotifyUrl,
        durationMs: trackInfo.durationMs,
        playedAt: new Date(),
        playedBy: playedByUser._id,
      };

      dbRoom.songHistory.push(songEntry);

      // Keep only last 100 songs to prevent unlimited growth
      if (dbRoom.songHistory.length > 100) {
        dbRoom.songHistory = dbRoom.songHistory.slice(-100);
      }

      await dbRoom.save();
      console.log(
        `Added song "${trackInfo.name}" to room ${roomId} history`
      );
    } catch (error) {
      console.error('Error adding song to history:', error);
    }
  }

  // Clean up room from database when it ends
  static async cleanupRoom(roomId: string) {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          // participants: [],
          lastActive: new Date(),
        }
      );
      console.log(`Cleaned up room ${roomId} in database`);
    } catch (error) {
      console.error('Error cleaning up room:', error);
    }
  }

  // Get rooms by tags
  static async getRoomsByTags(tagFilters: string[], userId?: string) {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const rooms = await Room.find({
        isPublic: true,
        tags: { $in: tagFilters },
        lastActive: { $gte: fifteenMinutesAgo },
        participants: { $ne: [] },
      })
        .populate('hostId', 'displayName avatarUrl publicSlug')
        .populate('participants', 'displayName avatarUrl publicSlug')
        .sort({ lastActive: -1 });

      // Filter by memory state
      const memoryRooms = RoomManager.getRoomsMap();
      const activeRooms = rooms.filter((room) =>
        memoryRooms.has(room.roomId)
      );

      // Get user's following list if authenticated
      let userFollowing: string[] = [];
      if (userId) {
        const follows = await Follow.find({
          followerId: userId,
        }).populate('followingId', '_id');
        userFollowing = follows.map((f) =>
          f.followingId._id.toString()
        );
      }

      // Enhance rooms
      const enhancedRooms = activeRooms.map((room) => {
        const memoryRoom = memoryRooms.get(room.roomId);
        const hasFriends = room.participants.some((participant) =>
          userFollowing.includes(participant._id.toString())
        );
        const currentTrack =
          memoryRoom?.currentTrack || room.currentTrack;

        return {
          roomId: room.roomId,
          name: room.name,
          host: room.hostId,
          participantCount:
            memoryRoom?.members.length || room.participants.length,
          participants: room.participants,
          currentTrack,
          tags: room.tags || [],
          hasFriends,
          isActive: true,
          lastActive: room.lastActive,
          createdAt: room.createdAt,
        };
      });

      return enhancedRooms;
    } catch (error) {
      console.error('Error getting rooms by tags:', error);
      return [];
    }
  }

  // Get recent rooms by tags
  static async getRecentRoomsByTags(
    tagFilters: string[],
    userId?: string
  ) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const rooms = await Room.find({
        isPublic: true,
        tags: { $in: tagFilters },
        lastActive: {
          $gte: oneDayAgo,
          $lte: fifteenMinutesAgo,
        },
        songHistory: { $ne: [] },
      })
        .populate('hostId', 'displayName avatarUrl publicSlug')
        .populate('participants', 'displayName avatarUrl publicSlug')
        .populate(
          'songHistory.playedBy',
          'displayName avatarUrl publicSlug'
        )
        .sort({ lastActive: -1 })
        .limit(20);

      // Filter out active rooms
      const memoryRooms = RoomManager.getRoomsMap();
      const endedRooms = rooms.filter(
        (room) => !memoryRooms.has(room.roomId)
      );

      // Get user's following list if authenticated
      let userFollowing: string[] = [];
      if (userId) {
        const follows = await Follow.find({
          followerId: userId,
        }).populate('followingId', '_id');
        userFollowing = follows.map((f) =>
          f.followingId._id.toString()
        );
      }

      // Enhance rooms
      const enhancedRooms = endedRooms.map((room) => {
        const hasFriends = room.participants.some((participant) =>
          userFollowing.includes(participant._id.toString())
        );
        const lastPlayedTrack =
          room.songHistory.length > 0
            ? room.songHistory[room.songHistory.length - 1]
            : null;

        return {
          roomId: room.roomId,
          name: room.name,
          host: room.hostId,
          participantCount: room.participants.length,
          participants: room.participants,
          lastPlayedTrack,
          tags: room.tags || [],
          songHistoryCount: room.songHistory.length,
          hasFriends,
          isActive: false,
          lastActive: room.lastActive,
          createdAt: room.createdAt,
        };
      });

      return enhancedRooms;
    } catch (error) {
      console.error('Error getting recent rooms by tags:', error);
      return [];
    }
  }

  // Get active rooms (only those that exist in memory AND database)
  static async getActiveRooms(userId?: string) {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Get rooms from database that are recent
      const dbRooms = await Room.find({
        isPublic: true,
        lastActive: { $gte: fifteenMinutesAgo },
        participants: { $ne: [] }, // Only rooms with participants
      })
        .populate('hostId', 'displayName avatarUrl publicSlug')
        .populate('participants', 'displayName avatarUrl publicSlug')
        .sort({ lastActive: -1 });

      // Get in-memory rooms
      const memoryRooms = RoomManager.getRoomsMap();

      // Only return rooms that exist in BOTH memory and database
      const activeRooms = dbRooms.filter((room) =>
        memoryRooms.has(room.roomId)
      );

      // Get user's following list if authenticated
      let userFollowing: string[] = [];
      if (userId) {
        const follows = await Follow.find({
          followerId: userId,
        }).populate('followingId', '_id');
        userFollowing = follows.map((f) =>
          f.followingId._id.toString()
        );
      }

      // Enhance with in-memory data and friend information
      const enhancedRooms = activeRooms.map((room) => {
        const memoryRoom = memoryRooms.get(room.roomId);

        // Check if any participants are friends
        const hasFriends = room.participants.some((participant) =>
          userFollowing.includes(participant._id.toString())
        );

        // Get current track from memory (most up-to-date)
        const currentTrack =
          memoryRoom?.currentTrack || room.currentTrack;

        return {
          roomId: room.roomId,
          name: room.name,
          host: room.hostId,
          participantCount:
            memoryRoom?.members.length || room.participants.length,
          participants: room.participants,
          currentTrack,
          tags: room.tags || [],
          songHistoryCount: room.songHistory.length, // <-- Add this line
          hasFriends,
          isActive: true, // All rooms here are active
          lastActive: room.lastActive,
          createdAt: room.createdAt,
        };
      });

      return enhancedRooms;
    } catch (error) {
      console.error('Error getting active rooms:', error);
      return [];
    }
  }

  // Get recently ended rooms (in database but not in memory)
  static async getRecentlyEndedRooms(userId?: string) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // Last hour
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Get rooms from database that ended recently
      const dbRooms = await Room.find({
        isPublic: true,
        lastActive: {
          $gte: oneDayAgo, // only rooms that ended in the last hour
          // $lte: fifteenMinutesAgo // but not in the last 15 minutes
        },
        songHistory: { $ne: [] }, // Only rooms that had some activity
      })
        .populate('hostId', 'displayName avatarUrl publicSlug')
        .populate('participants', 'displayName avatarUrl publicSlug')
        .populate(
          'songHistory.playedBy',
          'displayName avatarUrl publicSlug'
        )
        .sort({ lastActive: -1 })
        .limit(20);

      // Get in-memory rooms to exclude active ones
      const memoryRooms = RoomManager.getRoomsMap();

      // Only return rooms that are NOT in memory (ended)
      const endedRooms = dbRooms.filter(
        (room) => !memoryRooms.has(room.roomId)
      );

      // Get user's following list if authenticated
      let userFollowing: string[] = [];
      if (userId) {
        const follows = await Follow.find({
          followerId: userId,
        }).populate('followingId', '_id');
        userFollowing = follows.map((f) =>
          f.followingId._id.toString()
        );
      }

      // Enhance with friend information and last played track
      const enhancedRooms = endedRooms.map((room) => {
        // Check if any participants were friends
        const hasFriends = room.participants.some((participant) =>
          userFollowing.includes(participant._id.toString())
        );

        // Get last played track from history
        const lastPlayedTrack =
          room.songHistory.length > 0
            ? room.songHistory[room.songHistory.length - 1]
            : null;

        return {
          roomId: room.roomId,
          name: room.name,
          host: room.hostId,
          participantCount: room.participants.length,
          participants: room.participants,
          lastPlayedTrack,
          tags: room.tags || [],
          songHistoryCount: room.songHistory.length,
          hasFriends,
          isActive: false,
          lastActive: room.lastActive,
          createdAt: room.createdAt,
        };
      });

      return enhancedRooms;
    } catch (error) {
      console.error('Error getting recently ended rooms:', error);
      return [];
    }
  }

  // Search rooms by name
  static async searchRooms(
    query: string,
    userId?: string,
    activeOnly: boolean = true,
    tagFilters: string[] = []
  ) {
    try {
      const searchRegex = new RegExp(query, 'i');
      // const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      let searchCriteria: any = {
        isPublic: true,
        $or: [
          { name: searchRegex },
          { 'hostId.displayName': searchRegex },
        ],
      };

      // Add tag filters
      if (tagFilters.length > 0) {
        searchCriteria.tags = { $in: tagFilters };
      }

      if (activeOnly) {
        // searchCriteria.lastActive = { $gte: fifteenMinutesAgo };
        searchCriteria.participants = { $ne: [] };
      }

      const rooms = await Room.find(searchCriteria)
        .populate('hostId', 'displayName avatarUrl publicSlug')
        .populate('participants', 'displayName avatarUrl publicSlug')
        .sort({ lastActive: -1 })
        .limit(20);

      // Filter by memory state if activeOnly
      const memoryRooms = RoomManager.getRoomsMap();
      const filteredRooms = activeOnly
        ? rooms.filter((room) => memoryRooms.has(room.roomId))
        : rooms;

      // Get user's following list if authenticated
      let userFollowing: string[] = [];
      if (userId) {
        const follows = await Follow.find({
          followerId: userId,
        }).populate('followingId', '_id');
        userFollowing = follows.map((f) =>
          f.followingId._id.toString()
        );
      }

      // Enhance rooms
      const enhancedRooms = filteredRooms.map((room) => {
        const memoryRoom = memoryRooms.get(room.roomId);
        const isActive = !!memoryRoom;

        const hasFriends = room.participants.some((participant) =>
          userFollowing.includes(participant._id.toString())
        );

        const currentTrack =
          memoryRoom?.currentTrack || room.currentTrack;
        const lastPlayedTrack =
          !isActive && room.songHistory.length > 0
            ? room.songHistory[room.songHistory.length - 1]
            : null;

        return {
          roomId: room.roomId,
          name: room.name,
          host: room.hostId,
          participantCount: isActive
            ? memoryRoom.members.length
            : room.participants.length,
          participants: room.participants,
          currentTrack: isActive ? currentTrack : undefined,
          lastPlayedTrack: !isActive ? lastPlayedTrack : undefined,
          tags: room.tags || [],
          songHistoryCount: room.songHistory.length,
          hasFriends,
          isActive,
          lastActive: room.lastActive,
          createdAt: room.createdAt,
        };
      });

      return enhancedRooms;
    } catch (error) {
      console.error('Error searching rooms:', error);
      return [];
    }
  }

  // Legacy method for backward compatibility
  static async getDiscoveryRooms(userId?: string) {
    return this.getActiveRooms(userId);
  }
}
