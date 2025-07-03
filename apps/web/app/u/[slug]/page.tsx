'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, animate } from 'framer-motion';
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
  ArrowRight,
  PlayCircle,
  Music as Music2,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { formatDuration, timeAgo } from '@sonder/utils';
import { profileApi, bookmarkApi } from '@/lib/api';
import BookmarkModal from '@/components/BookmarkModal';
import toast from 'react-hot-toast';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

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
type Section =
  | 'profile'
  | 'artists'
  | 'tracks'
  | 'recent'
  | 'playlists'
  | 'bookmarks';

export default function UserProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] =
    useState<Section>('profile');
  const [timeRange, setTimeRange] = useState<TimeRange>('long');
  const [mounted, setMounted] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const isOwnProfile = user?.publicSlug === slug;

  useEffect(() => {
    setMounted(true);
  }, []);

  // React Query for profile data
  const {
    data: profileData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['profile', slug],
    queryFn: () => profileApi.getProfile(slug),
    enabled: !!slug,
  });

  // React Query for bookmarks
  const {
    data: bookmarksData,
    isLoading: bookmarksLoading,
    refetch: refetchBookmarks,
  } = useQuery({
    queryKey: ['bookmarks', slug],
    queryFn: () => bookmarkApi.getBookmarksForUser(slug),
    enabled: !!slug && activeSection === 'bookmarks',
  });

  const profile = profileData?.data;
  const bookmarks = bookmarksData?.data?.bookmarks || [];

  const openSpotifyUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const openSpotifyAtTimestamp = (spotifyUrl: string, timestampMs: number) => {
    // Extract track ID from Spotify URL
    const trackId = spotifyUrl.split('/track/')[1]?.split('?')[0];
    if (trackId) {
      const timestampSeconds = Math.floor(timestampMs / 1000);
      const spotifyAppUrl = `spotify:track:${trackId}:${timestampSeconds}`;
      const fallbackUrl = `${spotifyUrl}#${timestampSeconds}`;

      // Try to open in Spotify app first, fallback to web
      window.location.href = spotifyAppUrl;
      setTimeout(() => {
        window.open(fallbackUrl, '_blank');
      }, 1000);
    } else {
      window.open(spotifyUrl, '_blank');
    }
  };

  const handleBookmarkMoment = async (caption: string) => {
    if (!profile?.nowPlaying) return;

    setBookmarkLoading(true);
    try {
      const bookmarkData = {
        trackId: profile.nowPlaying.spotifyUrl.split('/track/')[1]?.split('?')[0] || '',
        timestampMs: profile.nowPlaying.progressMs,
        caption: caption.trim() || undefined,
        metadata: {
          name: profile.nowPlaying.song,
          artists: [{  name: profile.nowPlaying.artist }],
          album: {
            name: profile.nowPlaying.album,
            imageUrl: profile.nowPlaying.albumArt,
          },
          spotifyUrl: profile.nowPlaying.spotifyUrl,
        },
      };

      await bookmarkApi.createBookmark(bookmarkData);
      toast.success('Moment bookmarked successfully! 📍');
      setShowBookmarkModal(false);
      refetchBookmarks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to bookmark moment');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await bookmarkApi.deleteBookmark(bookmarkId);
      toast.success('Bookmark deleted');
      refetchBookmarks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete bookmark');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-gray-900 dark:text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Profile not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This user doesn't exist or their profile is private.
          </p>
        </div>
      </div>
    );
  }

  const timeRangeLabels = {
    long: 'All Time',
    medium: 'Last 6 Months',
    short: 'Last 4 Weeks',
  };

  const currentArtists =
    profile.spotifyProfile?.topArtists?.[timeRange] || [];
  const currentTracks =
    profile.spotifyProfile?.topTracks?.[timeRange] || [];
  const recentTracks =
    profile.spotifyProfile?.recentlyPlayedTracks?.items || [];
  const shortTracks = profile.spotifyProfile?.topTracks?.short || [];
  const longTracks = profile.spotifyProfile?.topTracks?.long || [];
  const longArtists = profile.spotifyProfile?.topArtists?.long || [];

  const sidebarItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'artists', icon: Users, label: 'Top Artists' },
    { id: 'tracks', icon: Music, label: 'Top Tracks' },
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'playlists', icon: List, label: 'Playlists' },
    { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Side Navigation */}
        <div className="w-28 bg-white dark:bg-black fixed left-0 top-0 h-full flex flex-col">
          {/* Sonder.fm logo at the top */}
          <div className="flex items-center gap-2 h-16 px-4 select-none">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-lg font-bold text-black dark:text-white tracking-tight">
              Sonder.fm
            </span>
          </div>

          {/* Centered Navigation */}
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            <nav className="flex flex-col items-center gap-y-6 w-full">
              {sidebarItems.map(({ id, icon: Icon, label }) => (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveSection(id as Section)}
                  className={`w-full flex flex-col items-center py-2 transition-all group text-black dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none ${
                    activeSection === id
                      ? 'border-l-4 border-green-500 bg-gray-200 dark:bg-[#181818] text-black dark:text-white'
                      : 'border-l-4 border-transparent'
                  }`}
                  style={{ minWidth: '100%' }}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-sm font-normal">{label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Footer at the bottom (GitHub icon) */}
          <div className="mb-6 flex items-center justify-center w-full">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 text-black dark:text-white"
              >
                <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-28 flex-1">
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 z-40">
            <div className="px-8 py-4 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </motion.button>

              {mounted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
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
                  recentTracks={recentTracks}
                  shortTracks={shortTracks}
                  longTracks={longTracks}
                  longArtists={longArtists}
                  setActiveSection={setActiveSection}
                  openSpotifyUrl={openSpotifyUrl}
                  isOwnProfile={isOwnProfile}
                  onBookmarkMoment={() => setShowBookmarkModal(true)}
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
                  playlists={
                    profile.spotifyProfile?.playlists?.items || []
                  }
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'bookmarks' && (
                <BookmarksSection
                  bookmarks={bookmarks}
                  loading={bookmarksLoading}
                  isOwnProfile={isOwnProfile}
                  onPlayAtTimestamp={openSpotifyAtTimestamp}
                  onDeleteBookmark={handleDeleteBookmark}
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
                  onClick={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
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
                recentTracks={recentTracks}
                shortTracks={shortTracks}
                longTracks={longTracks}
                longArtists={longArtists}
                setActiveSection={setActiveSection}
                openSpotifyUrl={openSpotifyUrl}
                isOwnProfile={isOwnProfile}
                onBookmarkMoment={() => setShowBookmarkModal(true)}
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
                playlists={
                  profile.spotifyProfile?.playlists?.items || []
                }
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'bookmarks' && (
              <BookmarksSection
                bookmarks={bookmarks}
                loading={bookmarksLoading}
                isOwnProfile={isOwnProfile}
                onPlayAtTimestamp={openSpotifyAtTimestamp}
                onDeleteBookmark={handleDeleteBookmark}
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

      {/* Bookmark Modal */}
      {profile?.nowPlaying && (
        <BookmarkModal
          isOpen={showBookmarkModal}
          onClose={() => setShowBookmarkModal(false)}
          onSave={handleBookmarkMoment}
          loading={bookmarkLoading}
          trackInfo={{
            name: profile.nowPlaying.song,
            artist: profile.nowPlaying.artist,
            album: profile.nowPlaying.album,
            albumArt: profile.nowPlaying.albumArt,
            timestampMs: profile.nowPlaying.progressMs,
          }}
        />
      )}
    </div>
  );
}

// Profile Section Component
function ProfileSection({
  profile,
  recentTracks,
  shortTracks,
  longTracks,
  longArtists,
  setActiveSection,
  openSpotifyUrl,
  isOwnProfile,
  onBookmarkMoment,
}: any) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
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
            className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover shadow-xl"
          />
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
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Followers
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {profile.spotifyProfile?.following || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Following
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {profile.spotifyProfile?.playlists?.total || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Playlists
            </div>
          </div>
        </motion.div>
      </div>

      {/* Now Playing Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-2xl mx-auto mb-12"
      >
        {profile.nowPlaying ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/20 transition-all border border-gray-200 dark:border-gray-800 relative">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={profile.nowPlaying.albumArt}
                  alt={profile.nowPlaying.album}
                  className="w-16 h-16 rounded-md shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-500 font-medium animate-pulse">
                    Now Playing
                  </span>
                </div>
                <h3 className="text-lg font-semibold truncate mt-1">
                  {profile.nowPlaying.song}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {profile.nowPlaying.artist} •{' '}
                  {profile.nowPlaying.album}
                </p>

                {/* Progress Bar */}
                <div className="mt-2 space-y-1">
                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${
                          (profile.nowPlaying.progressMs /
                            profile.nowPlaying.durationMs) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {formatTime(profile.nowPlaying.progressMs)}
                    </span>
                    <span>
                      {formatTime(profile.nowPlaying.durationMs)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {profile.nowPlaying.previewUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add preview play functionality here
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <PlayCircle className="w-6 h-6 text-green-500" />
                  </button>
                )}

                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmarkMoment();
                    }}
                    className="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors group"
                    title="Bookmark this moment"
                  >
                    <BookmarkPlus className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* <button
              onClick={() => openSpotifyUrl(profile.nowPlaying.spotifyUrl)}
              className="absolute inset-0 w-full h-full"
            /> */}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-3 hover:bg-white/10 transition-all border border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2">
            <Music2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Music on pause.
            </span>
          </div>
        )}
      </motion.div>

      {/* Recently Played Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recently Played</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('recent')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
          {recentTracks.slice(0, 12).map((item: any, index: number) => (
            <motion.div
              key={`${item.trackId}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(item.trackUrl)}
              className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square bg-gray-200 dark:bg-gray-800"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.trackName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <Music className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {item.trackName}
                </h3>
                <p className="text-xs opacity-80">
                  {timeAgo(new Date(item.playedAt))}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Songs I Love Right Now Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Songs I love right now
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('tracks')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
          {shortTracks.slice(0, 12).map((track: any, index: number) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src={track.album.imageUrl}
                alt={track.album.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {track.name}
                </h3>
                <p className="text-xs opacity-80 truncate">
                  {track.artists.map((a: any) => a.name).join(', ')}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* My All Time Fav Tracks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            My All Time fav tracks
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('tracks')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
          {longTracks.slice(0, 12).map((track: any, index: number) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src={track.album.imageUrl}
                alt={track.album.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {track.name}
                </h3>
                <p className="text-xs opacity-80 truncate">
                  {track.artists.map((a: any) => a.name).join(', ')}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Playlists Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Playlists</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('playlists')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
          {profile.spotifyProfile?.playlists?.items
            ?.slice(0, 12)
            .map((playlist: any, index: number) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => openSpotifyUrl(playlist.url)}
                className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square"
              >
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden">
                  {playlist.imageUrl ? (
                    <img
                      src={playlist.imageUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <List className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-xs font-semibold truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-xs opacity-80">
                    {playlist.tracks} tracks
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* My All Time Fav Artists Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            My All Time fav artists
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('artists')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
          {longArtists.slice(0, 12).map((artist: any, index: number) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(artist.url)}
              className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {artist.name}
                </h3>
                <p className="text-xs opacity-80">
                  {artist.followers?.toLocaleString()} followers
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Artists Section Component
function ArtistsSection({
  artists,
  timeRange,
  setTimeRange,
  timeRangeLabels,
  openSpotifyUrl,
}: any) {
  return (
    <motion.div
      key="artists"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6 md:mb-0 text-center md:text-left w-full md:w-auto">
          Top Artists
        </h1>
        {/* Time Range Tabs */}
        <div className="flex justify-center md:justify-end w-full md:w-auto">
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
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {artists.map((artist: any, index: number) => (
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
            <h3 className="font-semibold text-sm truncate">
              {artist.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {artist.followers?.toLocaleString()} followers
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Tracks Section Component
function TracksSection({
  tracks,
  timeRange,
  setTimeRange,
  timeRangeLabels,
  openSpotifyUrl,
}: any) {
  return (
    <motion.div
      key="tracks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6">
          Top Tracks
        </h1>

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
          {tracks.map((track: any, index: number) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
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
                <div className="font-medium truncate">
                  {track.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {track.artists.map((a: any) => a.name).join(', ')} •{' '}
                  {track.album.name}
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
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">
          Recently Played Tracks
        </h1>

        {/* Recent Tracks List */}
        <div className="space-y-3">
          {recentTracks.map((item: any, index: number) => (
            <motion.div
              key={`${item.trackId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => openSpotifyUrl(item.trackUrl)}
              className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.trackName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">
                  {item.trackName}
                </div>
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
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">
          Playlists
        </h1>

        {/* Playlists Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist: any, index: number) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(playlist.url)}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
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
              <h3 className="font-semibold text-sm truncate mb-1">
                {playlist.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {playlist.tracks} tracks
              </p>
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

// Bookmarks Section Component
function BookmarksSection({
  bookmarks,
  loading,
  isOwnProfile,
  onPlayAtTimestamp,
  onDeleteBookmark,
}: any) {
  if (loading) {
    return (
      <motion.div
        key="bookmarks"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-center justify-center py-20"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="bookmarks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">
          Bookmarked Moments
        </h1>

        {bookmarks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No bookmarks yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isOwnProfile
                ? 'Start bookmarking special moments in your favorite songs!'
                : 'This user hasn\'t bookmarked any moments yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark: any, index: number) => (
              <motion.div
                key={bookmark._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 dark:bg-gray-800/50 rounded-2xl p-6 hover:bg-white/10 dark:hover:bg-gray-800/70 transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={bookmark.metadata.album.imageUrl}
                    alt={bookmark.metadata.album.name}
                    className="w-16 h-16 rounded-lg object-cover shadow-lg flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                          {bookmark.metadata.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {bookmark.metadata.artists.map((a: any) => a.name).join(', ')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                              {formatTime(bookmark.timestampMs)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {timeAgo(new Date(bookmark.createdAt))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onPlayAtTimestamp(bookmark.metadata.spotifyUrl, bookmark.timestampMs)}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                          title="Play on Spotify"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </motion.button>

                        {isOwnProfile && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDeleteBookmark(bookmark._id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                            title="Delete bookmark"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {bookmark.caption && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                          "{bookmark.caption}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}