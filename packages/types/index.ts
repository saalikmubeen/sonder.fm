export interface User {
  _id?: string;
  spotifyId: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  refreshTokenEncrypted: string;
  publicSlug: string;
  profileTheme: ProfileTheme;
  vibeSummary: string;
  topArtists: string[];
  stats: UserStats;
  cachedNowPlaying?: NowPlaying;
  cachedUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  followers: number;
  following: number;
  totalMinutesListened: number;
  topGenres: string[];
  recentTracks: number;
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
  _id?: string;
  followerId: string;
  followingId: string;
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
  targetUserId: string;
  note: string;
  isAnonymous: boolean;
  authorId?: string;
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

export type ProfileTheme = 'default' | 'dark' | 'pastel' | 'grunge' | 'sadcore' | 'neon' | 'forest';

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
  followers: { total: number };
}

export interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  external_urls: { spotify: string };
  preview_url?: string;
  duration_ms: number;
}

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack;
}

export interface SpotifyTopArtists {
  items: Array<{
    name: string;
    genres: string[];
    popularity: number;
    images: Array<{ url: string }>;
  }>;
}

// Socket.IO event types
export interface ServerToClientEvents {
  message_received: (message: Message) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  typing_start: (data: { userId: string; conversationId: string }) => void;
  typing_stop: (data: { userId: string; conversationId: string }) => void;
}

export interface ClientToServerEvents {
  join_room: (userId: string) => void;
  send_message: (data: { receiverId: string; content: string }) => void;
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
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
  profileTheme: ProfileTheme;
  vibeSummary: string;
  nowPlaying?: NowPlaying;
  stats: UserStats;
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