import { Room } from '../models/Room';
import { RoomManager } from '../models/JammingRoom';
import { User } from '../models/User';

export class RoomSyncService {
  // Sync in-memory room to database
  static async syncRoomToDatabase(roomId: string) {
    try {
      const memoryRoom = RoomManager.getRoom(roomId);
      if (!memoryRoom) return;

      // Find or create room in database
      let dbRoom = await Room.findOne({ roomId });

      if (!dbRoom) {
        // Create new room in database
        const host = await User.findOne({ spotifyId: memoryRoom.hostSpotifyId });
        if (!host) return;

        dbRoom = new Room({
          roomId: memoryRoom.roomId,
          name: roomId, // Use roomId as name for now
          hostId: host._id,
          hostSpotifyId: memoryRoom.hostSpotifyId,
          isPublic: true,
          participants: [],
          currentTrack: memoryRoom.currentTrack,
          songHistory: [],
        });
      }

      // Update participants
      const participantIds = await Promise.all(
        memoryRoom.members.map(async (member) => {
          const user = await User.findOne({ spotifyId: member.spotifyId });
          return user?._id;
        })
      );

      dbRoom.participants = participantIds.filter(Boolean);
      dbRoom.currentTrack = memoryRoom.currentTrack;
      dbRoom.lastActive = new Date();

      await dbRoom.save();
      return dbRoom;
    } catch (error) {
      console.error('Error syncing room to database:', error);
    }
  }

  // Add song to history when a new track is played
  static async addSongToHistory(roomId: string, trackInfo: any, playedBySpotifyId: string) {
    try {
      const playedByUser = await User.findOne({ spotifyId: playedBySpotifyId });
      if (!playedByUser) return;

      const dbRoom = await Room.findOne({ roomId });
      if (!dbRoom) return;

      // Check if this is actually a new track (avoid duplicates)
      const lastSong = dbRoom.songHistory[dbRoom.songHistory.length - 1];
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
      console.log(`Added song "${trackInfo.name}" to room ${roomId} history`);
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
          participants: [],
          lastActive: new Date(),
        }
      );
      console.log(`Cleaned up room ${roomId} in database`);
    } catch (error) {
      console.error('Error cleaning up room:', error);
    }
  }

  // Get rooms for discovery with friend information
  static async getDiscoveryRooms(userId?: string) {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Get active rooms from database
      const dbRooms = await Room.find({
        $or: [
          { isPublic: true },
          { participants: userId }
        ],
        lastActive: { $gte: fifteenMinutesAgo },
        participants: { $ne: [] } // Only rooms with participants
      })
      .populate('hostId', 'displayName avatarUrl publicSlug')
      .populate('participants', 'displayName avatarUrl publicSlug')
      .populate('songHistory.playedBy', 'displayName avatarUrl publicSlug')
      .sort({ lastActive: -1 })
      .limit(20);

      // Get user's following list if authenticated
      let userFollowing: string[] = [];
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          // const followingUsers = await User.find({ _id: { $in: user.following || [] } });
          // userFollowing = followingUsers.map(u => u._id.toString());

           const followingIds: string[] = (user && (user as any).following) ? (user as any).following.map((id: any) => id.toString()) : [];
           userFollowing = followingIds;
        }
      }

      // Enhance with in-memory data and friend information
      const enhancedRooms = dbRooms.map(room => {
        const memoryRoom = RoomManager.getRoom(room.roomId);

        // Check if any participants are friends
        const hasFriends = room.participants.some(participant =>
          userFollowing.includes(participant._id.toString())
        );

        // Get current track from memory or database
        const currentTrack = memoryRoom?.currentTrack || room.currentTrack;

        // Get last played track if no current track
        const lastPlayedTrack = room.songHistory.length > 0
          ? room.songHistory[room.songHistory.length - 1]
          : null;

        return {
          roomId: room.roomId,
          name: room.name,
          host: room.hostId,
          participantCount: memoryRoom?.members.length || room.participants.length,
          participants: room.participants,
          currentTrack,
          lastPlayedTrack,
          hasFriends,
          isActive: !!memoryRoom,
          lastActive: room.lastActive,
          createdAt: room.createdAt,
        };
      });

      return enhancedRooms.filter(room => room.participantCount > 0);
    } catch (error) {
      console.error('Error getting discovery rooms:', error);
      return [];
    }
  }
}