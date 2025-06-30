import axios from 'axios';
import type {
  SpotifyTokens,
  SpotifyProfile,
  SpotifyCurrentlyPlaying,
  SpotifyTopArtists,
  NowPlaying
} from '@sonder/types';

export class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getAuthUrl(state?: string): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-top-read',
      'user-read-recently-played'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      ...(state && { state })
    });

    console.log(params);
    console.log(this.clientId)

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri
    });

    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      }
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      }
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }

  async getUserProfile(accessToken: string): Promise<SpotifyProfile> {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  async getCurrentlyPlaying(accessToken: string): Promise<NowPlaying | null> {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.data || !response.data.item) {
        return null;
      }

      const track = response.data as SpotifyCurrentlyPlaying;

      return {
        song: track.item.name,
        artist: track.item.artists.map(a => a.name).join(', '),
        album: track.item.album.name,
        albumArt: track.item.album.images[0]?.url || '',
        spotifyUrl: track.item.external_urls.spotify,
        previewUrl: track.item.preview_url,
        isPlaying: track.is_playing,
        progressMs: track.progress_ms,
        durationMs: track.item.duration_ms,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching currently playing:', error);
      return null;
    }
  }

  async getTopArtists(accessToken: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<SpotifyTopArtists> {
    const response = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=20`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  async getRecentlyPlayed(accessToken: string, limit: number = 20) {
    const response = await axios.get(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }
}