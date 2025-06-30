import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { SpotifyAPI, CryptoUtils } from '@sonder/utils';
import type { APIResponse, AuthResponse } from '@sonder/types';

const router = express.Router();

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
    data: { authUrl, state }
  });
});

// Handle Spotify callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=${error}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokens = await spotifyAPI.exchangeCodeForTokens(code as string);

    // Get user profile
    const profile = await spotifyAPI.getUserProfile(tokens.accessToken);

    // Check if user exists
    let user = await User.findOne({ spotifyId: profile.id });

    if (!user) {
      // Create new user
      const publicSlug = CryptoUtils.generateSlug();
      const encryptedRefreshToken = CryptoUtils.encrypt(tokens.refreshToken);

      user = new User({
        spotifyId: profile.id,
        displayName: profile.display_name || 'Music Lover',
        avatarUrl: profile.images?.[0]?.url || '',
        email: profile.email,
        refreshTokenEncrypted: encryptedRefreshToken,
        publicSlug,
        profileTheme: 'default',
        vibeSummary: `${profile.display_name || 'This user'} is discovering their musical journey...`,
        topArtists: [],
        stats: {
          followers: profile.followers?.total || 0,
          following: 0,
          totalMinutesListened: 0,
          topGenres: [],
          recentTracks: 0
        }
      });

      await user.save();
    } else {
      // Update existing user
      user.displayName = profile.display_name || user.displayName;
      user.avatarUrl = profile.images?.[0]?.url || user.avatarUrl;
      user.email = profile.email;
      user.refreshTokenEncrypted = CryptoUtils.encrypt(tokens.refreshToken);

      await user.save();
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, spotifyId: user.spotifyId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${jwtToken}&slug=${user.publicSlug}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=auth_failed`);
  }
});

// Verify JWT token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId).select('-refreshTokenEncrypted');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const response: APIResponse<{ user: any }> = {
      success: true,
      data: { user }
    };

    res.json(response);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Since we're using stateless JWT, logout is handled client-side
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;