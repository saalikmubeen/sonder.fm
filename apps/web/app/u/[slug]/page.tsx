'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Music, 
  Clock, 
  Users, 
  List, 
  ChevronRight,
  Play,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDuration, timeAgo } from '@sonder/utils';

interface UserProfile {
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
  profileTheme: string;
  vibeSummary: string;
  spotifyProfile: {
    followers: number;
    following: number;
    playlists: {
      total: number;
      items: any[];
    };
    topArtists: {
      short: any[];
      medium: any[];
      long: any[];
    };
    topTracks: {
      short: any[];
      medium: any[];
      long: any[];
    };
    recentlyPlayedTracks: {
      items: any[];
    };
  };
}

type TimeRange = 'short' | 'medium' | 'long';
type Section = 'profile' | 'artists' | 'tracks' | 'recent' | 'playlists';

export default function UserProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [timeRange, setTimeRange] = useState<TimeRange>('long');

  const isOwnProfile = user?.publicSlug === slug;

  useEffect(() => {
    fetchProfile();
  }, [slug]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/profile/${slug}`);
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-gray-400">This user doesn't exist or their profile is private.</p>
        </div>
      </div>
    );
  }

  const timeRangeLabels = {
    long: 'All Time',
    medium: 'Last 6 Months', 
    short: 'Last 4 Weeks'
  };

  const currentArtists = profile.spotifyProfile?.topArtists?.[timeRange] || [];
  const currentTracks = profile.spotifyProfile?.topTracks?.[timeRange] || [];
  const recentTracks = profile.spotifyProfile?.recentlyPlayedTracks?.items || [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </motion.button>
            
            {isOwnProfile && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-800 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Edit Profile
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <AnimatePresence mode="wait">
        {activeSection === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6"
          >
            {/* Avatar & Basic Info */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative inline-block mb-4"
              >
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-800"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Music className="w-4 h-4 text-black" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-2"
              >
                {profile.displayName}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center space-x-8 mb-6"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {profile.spotifyProfile?.followers || 0}
                  </div>
                  <div className="text-sm text-gray-400">FOLLOWERS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {profile.spotifyProfile?.following || 0}
                  </div>
                  <div className="text-sm text-gray-400">FOLLOWING</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {profile.spotifyProfile?.playlists?.total || 0}
                  </div>
                  <div className="text-sm text-gray-400">PLAYLISTS</div>
                </div>
              </motion.div>

              {isOwnProfile && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 border border-gray-600 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  LOGOUT
                </motion.button>
              )}
            </div>

            {/* Top Artists Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Artists of All Time</h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveSection('artists')}
                  className="px-4 py-2 border border-gray-600 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  SEE MORE
                </motion.button>
              </div>
              
              <div className="space-y-3">
                {currentArtists.slice(0, 2).map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{artist.name}</div>
                      <div className="text-sm text-gray-400">
                        {artist.followers?.toLocaleString()} followers
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Top Tracks Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Tracks of All Time</h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveSection('tracks')}
                  className="px-4 py-2 border border-gray-600 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  SEE MORE
                </motion.button>
              </div>
              
              <div className="space-y-3">
                {currentTracks.slice(0, 2).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <img
                      src={track.album.imageUrl}
                      alt={track.album.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{track.name}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDuration(track.durationMs)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Top Artists Section */}
        {activeSection === 'artists' && (
          <motion.div
            key="artists"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4 text-center">Top Artists</h1>
              
              {/* Time Range Tabs */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-gray-800 rounded-full p-1">
                  {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                    <motion.button
                      key={range}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {timeRangeLabels[range]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Artists Grid */}
              <div className="grid grid-cols-2 gap-6">
                {currentArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="relative mb-3">
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full aspect-square rounded-full object-cover"
                      />
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-6 h-6" />
                      </motion.div>
                    </div>
                    <h3 className="font-semibold text-sm truncate">{artist.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {artist.followers?.toLocaleString()} followers
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Tracks Section */}
        {activeSection === 'tracks' && (
          <motion.div
            key="tracks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4 text-center">Top Tracks</h1>
              
              {/* Time Range Tabs */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-gray-800 rounded-full p-1">
                  {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                    <motion.button
                      key={range}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {timeRangeLabels[range]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Tracks List */}
              <div className="space-y-3">
                {currentTracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="relative">
                      <img
                        src={track.album.imageUrl}
                        alt={track.album.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4 fill-white" />
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{track.name}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDuration(track.durationMs)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recently Played Section */}
        {activeSection === 'recent' && (
          <motion.div
            key="recent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-6 text-center">Recently Played Tracks</h1>
              
              {/* Recent Tracks List */}
              <div className="space-y-3">
                {recentTracks.map((item, index) => (
                  <motion.div
                    key={`${item.trackId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-400" />
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4 fill-white" />
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.trackName}</div>
                      <div className="text-sm text-gray-400 flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>{timeAgo(new Date(item.playedAt))}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDuration(item.durationMs)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Playlists Section */}
        {activeSection === 'playlists' && (
          <motion.div
            key="playlists"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-6 text-center">Playlists</h1>
              
              {/* Playlists Grid */}
              <div className="grid grid-cols-2 gap-4">
                {profile.spotifyProfile?.playlists?.items?.map((playlist, index) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                  >
                    <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      {playlist.imageUrl ? (
                        <img
                          src={playlist.imageUrl}
                          alt={playlist.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <List className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm truncate mb-1">{playlist.name}</h3>
                    <p className="text-xs text-gray-400">{playlist.tracks} tracks</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-gray-800">
        <div className="flex justify-around py-2">
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'artists', icon: Users, label: 'Top Artists' },
            { id: 'tracks', icon: Music, label: 'Top Tracks' },
            { id: 'recent', icon: Clock, label: 'Recent' },
            { id: 'playlists', icon: List, label: 'Playlists' },
          ].map(({ id, icon: Icon, label }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveSection(id as Section)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeSection === id
                  ? 'text-green-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
              {activeSection === id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20" />
    </div>
  );
}