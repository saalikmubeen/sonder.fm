import express from 'express';
import { param, validationResult } from 'express-validator';
import { auth, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { UserSpotifyProfile } from '../models/UserSpotifyProfile';
import { Follow } from '../models/Follow';
import { Reaction } from '../models/Reaction';
import { VibeNote } from '../models/VibeNote';
import type { APIResponse, PublicProfile } from '@sonder/types';
import { buildSpotifyProfile } from '../services/spotify';
import { CryptoUtils, SpotifyAPI } from '@sonder/utils';
import mongoose from 'mongoose';
import { ActivityLogger } from '../utils/activityLogger';

import { getRecentlyPlayed } from '../services/spotify';

const router = express.Router();

const spotifyAPI = new SpotifyAPI(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  process.env.SPOTIFY_REDIRECT_URI!
);

// Validation middleware using express-validator
const validateSlug = [
  param('slug')
    .isString()
    .withMessage('Slug must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Slug must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Slug can only contain letters, numbers, hyphens, and underscores'),
];

const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};




// Get public profile by slug
router.get('/:slug', validateSlug, handleValidationErrors, async (req: AuthRequest, res: express.Response) => {
  try {
    const { slug } = req.params;
    const currentUserId = req.headers.authorization
      ? await getCurrentUserId(req.headers.authorization)
      : null;

    const user = await User.findOne({ publicSlug: slug });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    // Refresh the spotify profile if it's been more than 1 day since the last update

    // If the access token is expired, refresh it
    // Add a delta of 5 minutes to ensure we refresh before it expires
    // Is the token going to expire within the next 5 minutes?
    // If yes, you refresh it ahead of time — which is a standard and reliable pattern.
    if (
      user.accessTokenExpiresAt &&
      user.accessTokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000
    ) {
      // Decrypt the refresh token
      const refreshToken = CryptoUtils.decrypt(
        user.refreshTokenEncrypted
      );
      const { accessToken, expiresIn } =
        await spotifyAPI.refreshAccessToken(refreshToken);
      user.accessToken = accessToken;
      user.accessTokenExpiresAt = new Date(
        Date.now() + expiresIn * 1000
      ); // 1 hour
      await user.save();
    }

    // Build the spotify profile if last updated is more than 1 day ago
    const userSpotifyProfile = await UserSpotifyProfile.findOne({
      userId: user._id.toString(),
    });

    let oneDay = 1000 * 60 * 60 * 24;
    let oneHour = 1000 * 60 * 60;
    let oneMin = 1000 * 60;
    if (
      userSpotifyProfile &&
      userSpotifyProfile.lastUpdated &&
      userSpotifyProfile.lastUpdated.getTime() + oneHour < Date.now()
    ) {
      console.log('Updating Spotify profile for user:', user._id);

      const {
        userInfo,
        playlistsInfo,
        topArtistsInfo,
        topTracksInfo,
        recentlyPlayedInfo,
        followedArtistsInfo,
      } = await buildSpotifyProfile({
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json',
      });

      // Update the spotify profile

      if (userSpotifyProfile) {
        userSpotifyProfile.spotifyId = userInfo.spotifyId;
        userSpotifyProfile.country = userInfo.country;
        userSpotifyProfile.displayName = userInfo.displayName;
        userSpotifyProfile.spotifyProfileUrl =
          userInfo.spotifyProfileUrl;
        userSpotifyProfile.avatarUrl = userInfo.avatarUrl;
        userSpotifyProfile.email = userInfo.email;
        userSpotifyProfile.followers = userInfo.followers;
        userSpotifyProfile.following = userInfo.following;
        userSpotifyProfile.premium = userInfo.premium;

        userSpotifyProfile.playlists = playlistsInfo;
        userSpotifyProfile.topArtists = topArtistsInfo;
        userSpotifyProfile.topTracks = topTracksInfo;
        userSpotifyProfile.recentlyPlayedTracks = {
          ...recentlyPlayedInfo,
          lastUpdated: new Date(),
        };
        userSpotifyProfile.followedArtists = followedArtistsInfo;
        userSpotifyProfile.lastUpdated = new Date();

        await userSpotifyProfile.save();
      }
      user.displayName = userInfo.displayName;
      user.avatarUrl = userInfo.avatarUrl;
      user.email = userInfo.email;
      await user.save();
    } else {
      // Update the recentlyPlayedTracks if it's been more than 1 hour
      if (
        userSpotifyProfile &&
        userSpotifyProfile.recentlyPlayedTracks &&
        userSpotifyProfile.recentlyPlayedTracks.lastUpdated &&
        userSpotifyProfile.recentlyPlayedTracks.lastUpdated.getTime() +
          oneDay <
          Date.now()
      ) {
        console.log(
          'Updating recently played tracks for user:',
          user._id
        );
        const recentlyPlayed = await getRecentlyPlayed({
          Authorization: `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        });

        const recentlyPlayedInfo = {
          total: recentlyPlayed.data.limit,
          items: recentlyPlayed.data.items.map((item: any) => ({
            trackName: item.track.name,
            trackId: item.track.id,
            trackUrl: item.track.external_urls.spotify,
            durationMs: item.track.duration_ms,
            playedAt: new Date(item.played_at),
            imageUrl: item.track.album.images?.[0]?.url,
          })),
        };

        if (userSpotifyProfile) {
          userSpotifyProfile.recentlyPlayedTracks = {
            total: recentlyPlayedInfo.total,
            items: recentlyPlayedInfo.items,
            lastUpdated: new Date(),
          };
          await userSpotifyProfile.save();
        }
      }
    }

    // Get reactions count
    const reactions = await Reaction.aggregate([
      { $match: { targetUserId: user._id.toString() } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } },
    ]);

    const reactionCounts: { [emoji: string]: number } = {};
    reactions.forEach((r) => {
      reactionCounts[r._id] = r.count;
    });

    // Get recent vibe notes
    const vibeNotes = await VibeNote.find({
      targetUserId: user._id.toString(),
    })
      .populate('authorId', 'displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(10);

    // Check if current user is following this profile
    let isFollowing = false;
    if (currentUserId) {
      const followRecord = await Follow.findOne({
        followerId: currentUserId,
        followingId: user._id,
      });
      isFollowing = !!followRecord;
    }

    const publicProfile: PublicProfile = {
      _id: user._id.toString(),
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      publicSlug: user.publicSlug,
      profileTheme: user.profileTheme,
      vibeSummary: user.vibeSummary,
      reactions: reactionCounts,
      vibeNotes: vibeNotes.map((note) => ({
        ...note.toObject(),
        authorId: note.isAnonymous ? undefined : note.authorId,
      })),
      isFollowing,
    };

    // Add spotify profile data if available
    if (userSpotifyProfile) {
      (publicProfile as any).spotifyProfile = userSpotifyProfile;
    }

    try {
      const nowPlaying = await spotifyAPI.getCurrentlyPlaying(
        user.accessToken
      );

      // Add now playing data if available
      if (nowPlaying) {
        publicProfile.nowPlaying = nowPlaying;

        user.cachedNowPlaying = nowPlaying;
        await user.save();
      }
    } catch (err) {
      console.log(err)
    }

    // if (user.cachedNowPlaying) {
    //   publicProfile.nowPlaying = user.cachedNowPlaying;
    // }

    const response: APIResponse<PublicProfile> = {
      success: true,
      data: publicProfile,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

// Update theme
router.put('/:slug/theme', auth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { theme } = req.body;
    const userId = (req as any).userId;

    const user = await User.findOne({ publicSlug: slug });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    // Check if user owns this profile
    if (user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile',
      });
    }

    const validThemes = [
      'default',
      'dark',
      'pastel',
      'grunge',
      'sadcore',
      'neon',
      'forest',
    ];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid theme',
      });
    }

    user.profileTheme = theme;
    await user.save();

    // Log activity
    ActivityLogger.themeChange(userId, theme);

    res.json({
      success: true,
      message: 'Theme updated successfully',
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update theme',
    });
  }
});

// // Get profile by slug
// router.get('/:slug', validateSlug, handleValidationErrors, async (req: AuthRequest, res: express.Response) => {
//   try {
//     const { slug } = req.params;
//     const userId = req.userId; // Will be undefined if not authenticated

//     // Use aggregation pipeline to get profile with follow status in one query
//     const profilePipeline = [
//       { $match: { publicSlug: slug } },
//       {
//         $lookup: {
//           from: 'userspotifyprofiles',
//           localField: 'spotifyProfile',
//           foreignField: '_id',
//           as: 'spotifyProfileData'
//         }
//       },
//       { $unwind: { path: '$spotifyProfileData', preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: 'follows',
//           let: { userId: '$_id' },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ['$followerId', userId ? new mongoose.Types.ObjectId(userId) : null] },
//                     { $eq: ['$followingId', '$$userId'] }
//                   ]
//                 }
//               }
//             }
//           ],
//           as: 'followStatus'
//         }
//       },
//       {
//         $addFields: {
//           isFollowing: { $gt: [{ $size: '$followStatus' }, 0] },
//           spotifyProfile: '$spotifyProfileData'
//         }
//       },
//       {
//         $project: {
//           displayName: 1,
//           avatarUrl: 1,
//           publicSlug: 1,
//           profileTheme: 1,
//           vibeSummary: 1,
//           cachedNowPlaying: 1,
//           isFollowing: 1,
//           spotifyProfile: 1,
//           _id: 0
//         }
//       }
//     ];

//     const profiles = await User.aggregate(profilePipeline);
//     const profile = profiles[0];

//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         error: 'Profile not found'
//       });
//     }

//     // Get reactions count
//     const reactions = await Reaction.aggregate([
//       { $match: { targetUserId: profile._id } },
//       { $group: { _id: '$emoji', count: { $sum: 1 } } },
//       { $project: { emoji: '$_id', count: 1, _id: 0 } }
//     ]);

//     const reactionsMap = reactions.reduce((acc, reaction) => {
//       acc[reaction.emoji] = reaction.count;
//       return acc;
//     }, {} as Record<string, number>);

//     // Get vibe notes
//     const vibeNotes = await VibeNote.find({ targetUserId: profile._id })
//       .populate('authorId', 'displayName publicSlug')
//       .sort({ createdAt: -1 })
//       .limit(10);


//     const response: APIResponse<PublicProfile> = {
//       success: true,
//       data: {
//         ...profile,
//         reactions: reactionsMap,
//         vibeNotes
//       }
//     };

//     res.json(response);
//   } catch (error) {
//     console.error('Error fetching profile:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch profile'
//     });
//   }
// });

// Update theme
router.put('/:slug/theme', auth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { theme } = req.body;
    const userId = (req as any).userId;

    const user = await User.findOne({ publicSlug: slug });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    // Check if user owns this profile
    if (user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile',
      });
    }

    const validThemes = [
      'default',
      'dark',
      'pastel',
      'grunge',
      'sadcore',
      'neon',
      'forest',
    ];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid theme',
      });
    }

    user.profileTheme = theme;
    await user.save();

    res.json({
      success: true,
      message: 'Theme updated successfully',
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update theme',
    });
  }
});

async function getCurrentUserId(
  authHeader: string
): Promise<string | null> {
  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId;
  } catch {
    return null;
  }
}

export default router;