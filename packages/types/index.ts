'use client';

import { Types } from 'mongoose';

export interface User {
  _id?: string;
  spotifyId: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  refreshTokenEncrypted: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  publicSlug: string;
  profileTheme: ProfileTheme;
  vibeSummary: string;
  spotifyProfile: Types.ObjectId; // Reference to UserSpotifyProfile
  cachedUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  cachedNowPlaying: NowPlaying | null;
}

export interface NowPlaying {
  song: string;
  artist: string;
  album: string;
  albumArt: string;
  spotifyUrl: string;
  previewUrl?: string;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  timestamp: Date;
}

export interface Follow {
  _id?: Types.ObjectId;
  // followerId: string;
  // followingId: string;
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
}

export interface Reaction {
  _id?: string;
  userId?: string; // optional for anonymous reactions
  targetUserId: string;
  emoji: string;
  createdAt: Date;
}

export interface VibeNote {
  _id?: string;
  targetUserId: Types.ObjectId;
  note: string;
  isAnonymous: boolean;
  authorId?: Types.ObjectId;
  createdAt: Date;
}

export interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  _id?: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
}

export interface Bookmark {
  _id?: string;
  userId: string;
  trackId: string;
  timestampMs: number;
  durationMs: number;
  caption?: string;
  metadata: {
    name: string;
    artists: { name: string }[];
    album: { name: string; imageUrl: string };
    spotifyUrl: string;
  };
  createdAt: Date;
}

export type ProfileTheme =
  | 'default'
  | 'dark'
  | 'pastel'
  | 'grunge'
  | 'sadcore'
  | 'neon'
  | 'forest'
  | 'sunset';

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface SpotifyArtist {
  id: string;
  name: string;
  imageUrl: string;
  url: string;
  followers: number;
  popularity: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string; url: string }[];
  album: {
    id: string;
    name: string;
    imageUrl: string;
    url: string;
    releaseDate: string;
  };
  popularity: number;
  durationMs: number;
  url: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tracks: number;
  url: string;
  public: boolean;
}

export interface RecentlyPlayedTracks {
  total: number;
  items: {
    trackName: string;
    trackId: string;
    trackUrl: string;
    durationMs: number;
    playedAt: string;
    imageUrl: string;
  }[];
  lastUpdated: Date;
}

export interface AudioFeatureSummary {
  valenceAvg: number;
  energyAvg: number;
  danceabilityAvg: number;
  acousticnessAvg: number;
  instrumentalnessAvg: number;
  tempoAvg: number;
}

export interface UserSpotifyProfile {
  userId: string;
  spotifyId: string;
  country: string;
  displayName: string;
  spotifyProfileUrl: string;
  avatarUrl?: string;
  email: string;
  followers: number;
  following: number;
  premium: boolean;

  playlists: {
    total: number;
    items: SpotifyPlaylist[];
  };
  topArtists: {
    short: SpotifyArtist[];
    medium: SpotifyArtist[];
    long: SpotifyArtist[];
  };
  topTracks: {
    short: SpotifyTrack[];
    medium: SpotifyTrack[];
    long: SpotifyTrack[];
  };
  recentlyPlayedTracks: RecentlyPlayedTracks;
  followedArtists: {
    total: number;
    items: SpotifyArtist[];
  };

  audioFeatureSummary?: AudioFeatureSummary;
  genreMap?: Record<string, number>;
  lastUpdated: Date;
}

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack;
}

// Socket.IO event types
export interface ServerToClientEvents {
  message_received: (message: Message) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  typing_start: (data: {
    userId: string;
    conversationId: string;
  }) => void;
  typing_stop: (data: {
    userId: string;
    conversationId: string;
  }) => void;
}

export interface ClientToServerEvents {
  join_room: (userId: string) => void;
  send_message: (data: {
    receiverId: string;
    content: string;
  }) => void;
  mark_read: (messageId: string) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;
}

export interface FeedItem {
  user: User;
  nowPlaying?: NowPlaying;
  timestamp: Date;
}

export interface PublicProfile {
  _id: string;
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
  profileTheme: ProfileTheme;
  vibeSummary: string;
  nowPlaying?: NowPlaying;
  reactions: { [emoji: string]: number };
  vibeNotes: VibeNote[];
  isFollowing?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RefreshToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt?: Date;
}
