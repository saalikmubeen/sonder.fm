import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { SpotifyAPI, CryptoUtils } from '@sonder/utils';
import type { APIResponse } from '@sonder/types';
import { RefreshToken } from '../models/RefreshToken';

import {
  buildSpotifyProfile,
  getAudioFeaturesForTracks,
  getUserInfo,
} from '../services/spotify';
import { release } from 'os';
import { UserSpotifyProfile } from '../models/UserSpotifyProfile';

const router = express.Router();

// 🔐 Helper to create secure refresh token
function generateRefreshToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(64).toString('base64url');
  const hashed = crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');
  return { raw, hashed };
}

const spotifyAPI = new SpotifyAPI(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  process.env.SPOTIFY_REDIRECT_URI!
);

console.log(process.env.SPOTIFY_CLIENT_ID);

// Get Spotify auth URL
router.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const authUrl = spotifyAPI.getAuthUrl(state);

  res.json({
    success: true,
    data: { authUrl, state },
  });
});

// Handle Spotify callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/error?error=${error}`
    );
  }

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/error?error=no_code`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await spotifyAPI.exchangeCodeForTokens(
      code as string
    );

    // Get user profile
    const profile = await spotifyAPI.getUserProfile(
      tokens.accessToken
    );

    // Check if user exists
    let user = await User.findOne({ spotifyId: profile.id });
    console.log('User:', user);

    if (!user) {
      // Create new user
      const publicSlug = CryptoUtils.generateSlug();
      const encryptedRefreshToken = CryptoUtils.encrypt(
        tokens.refreshToken
      );

      user = new User({
        spotifyId: profile.id,
        displayName: profile.display_name || 'Music Lover',
        avatarUrl: profile.images?.[0]?.url || '',
        email: profile.email,
        refreshTokenEncrypted: encryptedRefreshToken,
        accessToken: tokens.accessToken,
        // tokens.expiresIn > is in seconds | 36000 seconds = 1 hour
        accessTokenExpiresAt: new Date(
          Date.now() + tokens.expiresIn * 1000
        ), // 1 hour
        publicSlug,
        profileTheme: 'default',
        vibeSummary: `${
          profile.display_name || 'This user'
        } is discovering their musical journey...`,
      });

      await user.save();
    } else {
      // Update existing user
      console.log('Updating existing user');
      user.displayName = profile.display_name || user.displayName;
      user.avatarUrl = profile.images?.[0]?.url || user.avatarUrl;
      user.email = profile.email;
      user.refreshTokenEncrypted = CryptoUtils.encrypt(
        tokens.refreshToken
      );
      user.accessToken = tokens.accessToken;
      user.accessTokenExpiresAt = new Date(
        Date.now() + tokens.expiresIn * 1000
      ); // 1 hour

      await user.save();
    }

    console.log('User profile:', user);
    console.log('User ID:', user._id);
    console.log('Spotify ID:', user.spotifyId);

    // Fetch Spotify stats

    try {
      const {
        userInfo,
        playlistsInfo,
        topArtistsInfo,
        topTracksInfo,
        recentlyPlayedInfo,
        followedArtistsInfo,
      } = await buildSpotifyProfile({
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      });

      // check if userSpotifyProfile exists

      let userSpotifyProfile = await UserSpotifyProfile.findOne({
        userId: user._id,
      });
      if (!userSpotifyProfile) {
        if (!user || !user._id) {
          throw new Error('User not properly initialized');
        }

        userSpotifyProfile = new UserSpotifyProfile({
          userId: user._id,
          spotifyId: userInfo.spotifyId,
          country: userInfo.country,
          displayName: userInfo.displayName,
          spotifyProfileUrl: userInfo.spotifyProfileUrl,
          avatarUrl: userInfo.avatarUrl,
          email: userInfo.email,
          followers: userInfo.followers,
          following: userInfo.following,
          premium: userInfo.premium,
          playlists: playlistsInfo,
          topArtists: topArtistsInfo,
          topTracks: topTracksInfo,
          recentlyPlayedTracks: recentlyPlayedInfo,
          followedArtists: followedArtistsInfo,
        });

        await userSpotifyProfile.save();

        user.spotifyProfile = userSpotifyProfile._id;
        await user.save();
      } else {
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
    } catch (err) {
      console.error('Failed to fetch Spotify stats:', err);
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, spotifyId: user.spotifyId },
      process.env.JWT_SECRET!,
      // { expiresIn: '7d' }
      { expiresIn: '15m' }
    );

    // 🔁 Rotate refresh token
    const { raw, hashed } = generateRefreshToken();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashed,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30d
    });

    // res.cookie('access_token', jwtToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'lax',
    //   maxAge: 15 * 60 * 1000
    // });

    // res.cookie('refresh_token', raw, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'lax',
    //   maxAge: 30 * 24 * 60 * 60 * 1000
    // });

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/success?token=${jwtToken}&refreshToken=${raw}&slug=${user.publicSlug}`
    );
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/error?error=auth_failed`
    );
  }
});

// Verify JWT token
router.get('/verify', async (req, res) => {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies.access_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId).select(
      '-refreshTokenEncrypted'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    const response: APIResponse<{ user: any }> = {
      success: true,
      data: { user },
    };

    res.json(response);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

// ✅ Token refresh route
router.post('/refresh', async (req, res) => {
  const raw =
    req.cookies.refresh_token ||
    req.body?.refreshToken ||
    req.headers['x-refresh-token'];

  if (!raw)
    return res
      .status(401)
      .json({ success: false, error: 'Missing refresh token' });

  const hashed = crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');
  const stored = await RefreshToken.findOne({ tokenHash: hashed });

  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token expired or invalid',
    });
  }

  const user = await User.findById(stored.userId);

  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: 'User not found' });
  }

  // 🔁 Rotate refresh token
  await RefreshToken.deleteOne({ _id: stored._id });
  const { raw: newRaw, hashed: newHash } = generateRefreshToken();

  await RefreshToken.create({
    userId: stored.userId._id,
    tokenHash: newHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const newAccess = jwt.sign(
    { userId: stored.userId._id, spotifyId: user.spotifyId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  // res.cookie('access_token', newAccess, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'lax',
  //   maxAge: 15 * 60 * 1000
  // });

  // res.cookie('refresh_token', newRaw, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'lax',
  //   maxAge: 30 * 24 * 60 * 60 * 1000
  // });

  res.json({
    success: true,
    accessToken: newAccess,
    refreshToken: newRaw,
  });
});

// Logout
router.post('/logout', async (req, res) => {
  // Since we're using stateless JWT, logout is handled client-side

  const raw =
    req.cookies.refresh_token ||
    req.body?.refreshToken ||
    req.headers['x-refresh-token'];

  if (raw) {
    const hashed = crypto
      .createHash('sha256')
      .update(raw)
      .digest('hex');
    await RefreshToken.deleteOne({ tokenHash: hashed });
  }

  // res.clearCookie('access_token');
  // res.clearCookie('refresh_token');

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
