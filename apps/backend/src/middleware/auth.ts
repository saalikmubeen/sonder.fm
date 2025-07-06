import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { CryptoUtils, SpotifyAPI } from '@sonder/utils';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}



const spotifyAPI = new SpotifyAPI(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  process.env.SPOTIFY_REDIRECT_URI!
);


export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.'
      });
    }


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

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);

      if (user) {
        req.userId = decoded.userId;
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};