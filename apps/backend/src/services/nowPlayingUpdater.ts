import { User } from '../models/User';
import { SpotifyAPI, CryptoUtils, OpenAIService } from '@sonder/utils';

const spotifyAPI = new SpotifyAPI(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
  process.env.SPOTIFY_REDIRECT_URI!
);

const openAI = new OpenAIService(process.env.OPENAI_API_KEY!);

export const updateAllUsersNowPlaying = async () => {
  try {
    const users = await User.find({}).limit(100); // Process in batches
    
    for (const user of users) {
      try {
        await updateUserNowPlaying(user);
      } catch (error) {
        console.error(`Failed to update user ${user.spotifyId}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error('Error in bulk now-playing update:', error);
    throw error;
  }
};

export const updateUserNowPlaying = async (user: any) => {
  try {
    // Decrypt refresh token
    const refreshToken = CryptoUtils.decrypt(user.refreshTokenEncrypted);
    
    // Get new access token
    const tokens = await spotifyAPI.refreshAccessToken(refreshToken);
    
    // Get currently playing
    const nowPlaying = await spotifyAPI.getCurrentlyPlaying(tokens.accessToken);
    
    // Get top artists for vibe summary (every 10th update to save API calls)
    const shouldUpdateVibe = Math.random() < 0.1; // 10% chance
    let vibeSummary = user.vibeSummary;
    
    if (shouldUpdateVibe) {
      try {
        const topArtists = await spotifyAPI.getTopArtists(tokens.accessToken);
        const artistNames = topArtists.items.map(artist => artist.name).slice(0, 5);
        const topGenres = [...new Set(topArtists.items.flatMap(artist => artist.genres))].slice(0, 3);
        
        vibeSummary = await openAI.generateVibeSummary(
          user.displayName,
          artistNames,
          topGenres,
          nowPlaying ? { song: nowPlaying.song, artist: nowPlaying.artist } : undefined
        );
        
        // Update top artists and genres in user stats
        user.topArtists = artistNames;
        user.stats.topGenres = topGenres;
      } catch (error) {
        console.error('Error updating vibe summary:', error);
      }
    }
    
    // Update user data
    user.cachedNowPlaying = nowPlaying;
    user.cachedUpdatedAt = new Date();
    user.vibeSummary = vibeSummary;
    
    await user.save();
    
    console.log(`✅ Updated now-playing for ${user.displayName}`);
  } catch (error) {
    console.error(`❌ Failed to update ${user.displayName}:`, error);
    throw error;
  }
};

export const forceUpdateUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  await updateUserNowPlaying(user);
  return user;
};