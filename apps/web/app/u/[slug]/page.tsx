'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { 
  User, 
  Music, 
  Clock, 
  Users, 
  List, 
  ChevronRight,
  Play,
  ExternalLink,
  Calendar,
  Sun,
  Moon,
  ArrowRight
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
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [timeRange, setTimeRange] = useState<TimeRange>('long');
  const [mounted, setMounted] = useState(false);

  const isOwnProfile = user?.publicSlug === slug;

  useEffect(() => {
    setMounted(true);
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

  const openSpotifyUrl = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-gray-900 dark:text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-gray-600 dark:text-gray-400">This user doesn't exist or their profile is private.</p>
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

  const sidebarItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'artists', icon: Users, label: 'Top Artists' },
    { id: 'tracks', icon: Music, label: 'Top Tracks' },
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'playlists', icon: List, label: 'Playlists' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 z-50"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Music className="w-4 h-4 text-black" />
              </div>
              <span className="text-xl font-bold">Sonder.fm</span>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map(({ id, icon: Icon, label }) => (
                <motion.button
                  key={id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSection(id as Section)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeSection === id
                      ? 'bg-gray-100 dark:bg-gray-900 text-green-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="ml-64 flex-1">
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-40">
            <div className="px-8 py-4 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </motion.button>
              
              {mounted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && (
                <ProfileSection 
                  profile={profile} 
                  currentArtists={currentArtists}
                  currentTracks={currentTracks}
                  recentTracks={recentTracks}
                  setActiveSection={setActiveSection}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'artists' && (
                <ArtistsSection 
                  artists={currentArtists}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                  timeRangeLabels={timeRangeLabels}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'tracks' && (
                <TracksSection 
                  tracks={currentTracks}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                  timeRangeLabels={timeRangeLabels}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'recent' && (
                <RecentSection 
                  recentTracks={recentTracks}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'playlists' && (
                <PlaylistsSection 
                  playlists={profile.spotifyProfile?.playlists?.items || []}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </motion.button>
              
              {mounted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6 pb-24">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <ProfileSection 
                profile={profile} 
                currentArtists={currentArtists}
                currentTracks={currentTracks}
                recentTracks={recentTracks}
                setActiveSection={setActiveSection}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'artists' && (
              <ArtistsSection 
                artists={currentArtists}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                timeRangeLabels={timeRangeLabels}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'tracks' && (
              <TracksSection 
                tracks={currentTracks}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                timeRangeLabels={timeRangeLabels}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'recent' && (
              <RecentSection 
                recentTracks={recentTracks}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'playlists' && (
              <PlaylistsSection 
                playlists={profile.spotifyProfile?.playlists?.items || []}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50">
          <div className="flex justify-around py-2">
            {sidebarItems.map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveSection(id as Section)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  activeSection === id
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
      </div>
    </div>
  );
}

// Profile Section Component
function ProfileSection({ profile, currentArtists, currentTracks, recentTracks, setActiveSection, openSpotifyUrl }: any) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative inline-block mb-6"
        >
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover ring-4 ring-gray-200 dark:ring-gray-800 shadow-xl"
          />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <Music className="w-4 h-4 text-black" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl lg:text-4xl font-bold mb-4"
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
            <div className="text-sm text-gray-500 dark:text-gray-400">FOLLOWERS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {profile.spotifyProfile?.following || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">FOLLOWING</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {profile.spotifyProfile?.playlists?.total || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">PLAYLISTS</div>
          </div>
        </motion.div>
      </div>

      {/* Top Artists Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl font-bold">Top Artists of All Time</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection('artists')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            SEE MORE
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentArtists.slice(0, 2).map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => openSpotifyUrl(artist.url)}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-[3/2]"
            >
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-bold">{artist.name}</h3>
                <p className="text-sm opacity-80">{artist.followers?.toLocaleString()} followers</p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Top Tracks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl font-bold">Top Tracks of All Time</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection('tracks')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            SEE MORE
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentTracks.slice(0, 2).map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-[3/2]"
            >
              <img
                src={track.album.imageUrl}
                alt={track.album.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-bold truncate">{track.name}</h3>
                <p className="text-sm opacity-80 truncate">
                  {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                </p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recently Played Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl font-bold">Recently Played</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection('recent')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            SEE MORE
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
        
        <div className="space-y-3">
          {recentTracks.slice(0, 3).map((item, index) => (
            <motion.div
              key={`${item.trackId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => openSpotifyUrl(item.trackUrl)}
              className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.trackName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{timeAgo(new Date(item.playedAt))}</span>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {formatDuration(item.durationMs)}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Artists Section Component
function ArtistsSection({ artists, timeRange, setTimeRange, timeRangeLabels, openSpotifyUrl }: any) {
  return (
    <motion.div
      key="artists"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6">Top Artists</h1>
        
        {/* Time Range Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            {(Object.keys(timeRangeLabels) as any[]).map((range) => (
              <motion.button
                key={range}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {timeRangeLabels[range]}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {artists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(artist.url)}
              className="text-center cursor-pointer group"
            >
              <div className="relative mb-3">
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-full aspect-square rounded-full object-cover shadow-lg"
                />
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              <h3 className="font-semibold text-sm truncate">{artist.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {artist.followers?.toLocaleString()} followers
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Tracks Section Component
function TracksSection({ tracks, timeRange, setTimeRange, timeRangeLabels, openSpotifyUrl }: any) {
  return (
    <motion.div
      key="tracks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6">Top Tracks</h1>
        
        {/* Time Range Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            {(Object.keys(timeRangeLabels) as any[]).map((range) => (
              <motion.button
                key={range}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {timeRangeLabels[range]}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-3">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={track.album.imageUrl}
                  alt={track.album.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4 fill-white" />
                </motion.div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{track.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {formatDuration(track.durationMs)}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Recent Section Component
function RecentSection({ recentTracks, openSpotifyUrl }: any) {
  return (
    <motion.div
      key="recent"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">Recently Played Tracks</h1>
        
        {/* Recent Tracks List */}
        <div className="space-y-3">
          {recentTracks.map((item, index) => (
            <motion.div
              key={`${item.trackId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => openSpotifyUrl(item.trackUrl)}
              className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{item.trackName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{timeAgo(new Date(item.playedAt))}</span>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {formatDuration(item.durationMs)}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Playlists Section Component
function PlaylistsSection({ playlists, openSpotifyUrl }: any) {
  return (
    <motion.div
      key="playlists"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">Playlists</h1>
        
        {/* Playlists Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(playlist.url)}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {playlist.imageUrl ? (
                  <img
                    src={playlist.imageUrl}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <List className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="font-semibold text-sm truncate mb-1">{playlist.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{playlist.tracks} tracks</p>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <ExternalLink className="w-4 h-4 mx-auto" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}