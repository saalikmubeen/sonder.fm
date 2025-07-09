import { Activity, ActivityType, ActivityDocument } from '../models/Activity';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { Server } from 'socket.io';

interface LogActivityParams {
  actorId: string;
  type: ActivityType;
  targetUserId?: string;
  roomId?: string;
  roomName?: string;
  trackId?: string;
  trackName?: string;
  trackArtist?: string;
  trackAlbum?: string;
  trackImage?: string;
  metadata?: Record<string, any>;
}

// Debounce map to prevent spam logging
const debounceMap = new Map<string, number>();
const DEBOUNCE_DURATION = 30000; // 30 seconds

// Activity types that should be debounced
const DEBOUNCED_TYPES: ActivityType[] = ['track_play', 'room_join'];

export async function logActivity(params: LogActivityParams, io?: Server): Promise<void> {
  try {
    const { actorId, type, targetUserId, roomId, roomName, trackId, trackName, trackArtist, trackAlbum, trackImage, metadata = {} } = params;

    // Get actor information
    const actor = await User.findById(actorId).select('displayName avatarUrl publicSlug');
    if (!actor) {
      console.warn(`Activity logging failed: Actor ${actorId} not found`);
      return;
    }

    // Debounce certain activity types to prevent spam
    if (DEBOUNCED_TYPES.includes(type)) {
      const debounceKey = `${actorId}:${type}:${roomId || trackId || targetUserId}`;
      const lastLogged = debounceMap.get(debounceKey);
      const now = Date.now();
      
      if (lastLogged && (now - lastLogged) < DEBOUNCE_DURATION) {
        return; // Skip logging if within debounce period
      }
      
      debounceMap.set(debounceKey, now);
    }

    // Get target user information if applicable
    let targetUserName: string | undefined;
    let targetUserSlug: string | undefined;
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId).select('displayName publicSlug');
      if (targetUser) {
        targetUserName = targetUser.displayName;
        targetUserSlug = targetUser.publicSlug;
      }
    }

    // Create activity entry
    const activity = await Activity.create({
      actorId,
      actorName: actor.displayName,
      actorAvatar: actor.avatarUrl,
      actorSlug: actor.publicSlug,
      type,
      targetUserId: targetUserId || undefined,
      targetUserName,
      targetUserSlug,
      roomId,
      roomName,
      trackId,
      trackName,
      trackArtist,
      trackAlbum,
      trackImage,
      metadata,
      createdAt: new Date()
    });

    // Emit real-time activity to followers
    if (io) {
      await emitActivityToFollowers(activity, io);
    }

    // Trim old activities to keep only recent 100 per user
    await trimUserActivities(actorId);

    console.log(`✅ Activity logged: ${actor.displayName} -> ${type}`);
  } catch (error) {
    console.error('❌ Activity logging failed:', error);
  }
}

async function emitActivityToFollowers(activity: ActivityDocument, io: Server): Promise<void> {
  try {
    // Get followers of the actor
    const followers = await Follow.find({ followingId: activity.actorId }).select('followerId');
    const followerIds = followers.map(f => f.followerId.toString());

    // Emit to each follower's room
    followerIds.forEach(followerId => {
      io.to(`user:${followerId}`).emit('activity:new', {
        id: activity._id,
        actorId: activity.actorId,
        actorName: activity.actorName,
        actorAvatar: activity.actorAvatar,
        actorSlug: activity.actorSlug,
        type: activity.type,
        targetUserId: activity.targetUserId,
        targetUserName: activity.targetUserName,
        targetUserSlug: activity.targetUserSlug,
        roomId: activity.roomId,
        roomName: activity.roomName,
        trackId: activity.trackId,
        trackName: activity.trackName,
        trackArtist: activity.trackArtist,
        trackAlbum: activity.trackAlbum,
        trackImage: activity.trackImage,
        metadata: activity.metadata,
        createdAt: activity.createdAt
      });
    });
  } catch (error) {
    console.error('❌ Failed to emit activity to followers:', error);
  }
}

async function trimUserActivities(actorId: string): Promise<void> {
  try {
    // Get the latest 100 activities for this user
    const recentActivities = await Activity.find({ actorId })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('_id');

    const recentIds = recentActivities.map(a => a._id);

    // Delete activities older than the latest 100
    if (recentIds.length === 100) {
      await Activity.deleteMany({
        actorId,
        _id: { $nin: recentIds }
      });
    }
  } catch (error) {
    console.error('❌ Failed to trim user activities:', error);
  }
}

// Helper functions for specific activity types
export const ActivityLogger = {
  roomJoin: (actorId: string, roomId: string, roomName: string, io?: Server) =>
    logActivity({ actorId, type: 'room_join', roomId, roomName }, io),

  roomLeave: (actorId: string, roomId: string, roomName: string, io?: Server) =>
    logActivity({ actorId, type: 'room_leave', roomId, roomName }, io),

  roomCreate: (actorId: string, roomId: string, roomName: string, io?: Server) =>
    logActivity({ actorId, type: 'room_create', roomId, roomName }, io),

  vibeNote: (actorId: string, targetUserId: string, isAnonymous: boolean, notePreview: string, io?: Server) =>
    logActivity({
      actorId,
      type: 'vibe_note',
      targetUserId,
      metadata: { isAnonymous, noteText: notePreview.substring(0, 100) }
    }, io),

  reaction: (actorId: string, targetUserId: string, emoji: string, io?: Server) =>
    logActivity({
      actorId,
      type: 'reaction',
      targetUserId,
      metadata: { emoji }
    }, io),

  follow: (actorId: string, targetUserId: string, io?: Server) =>
    logActivity({ actorId, type: 'follow', targetUserId }, io),

  unfollow: (actorId: string, targetUserId: string, io?: Server) =>
    logActivity({ actorId, type: 'unfollow', targetUserId }, io),

  bookmark: (actorId: string, trackId: string, trackName: string, trackArtist: string, trackImage: string, timestamp: number, caption?: string, io?: Server) =>
    logActivity({
      actorId,
      type: 'bookmark',
      trackId,
      trackName,
      trackArtist,
      trackImage,
      metadata: { timestamp, caption }
    }, io),

  bookmarkDelete: (actorId: string, trackId: string, trackName: string, trackArtist: string, io?: Server) =>
    logActivity({
      actorId,
      type: 'bookmark_delete',
      trackId,
      trackName,
      trackArtist
    }, io),

  themeChange: (actorId: string, theme: string, io?: Server) =>
    logActivity({
      actorId,
      type: 'theme_change',
      metadata: { theme }
    }, io),

  trackPlay: (actorId: string, roomId: string, roomName: string, trackId: string, trackName: string, trackArtist: string, trackImage: string, io?: Server) =>
    logActivity({
      actorId,
      type: 'track_play',
      roomId,
      roomName,
      trackId,
      trackName,
      trackArtist,
      trackImage
    }, io),

  playlistExport: (actorId: string, roomId: string, roomName: string, playlistName: string, trackCount: number, io?: Server) =>
    logActivity({
      actorId,
      type: 'playlist_export',
      roomId,
      roomName,
      metadata: { playlistName, trackCount }
    }, io),

  profileUpdate: (actorId: string, changes: string[], io?: Server) =>
    logActivity({
      actorId,
      type: 'profile_update',
      metadata: { changes }
    }, io)
};