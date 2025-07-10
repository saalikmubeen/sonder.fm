'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Music,
  Users,
  Heart,
  Clock,
  Play,
  Pause,
  ArrowRight,
  Filter,
  Sparkles,
  Radio,
  Crown,
  ExternalLink,
  Search,
  X,
  History,
  Download,
  Loader2,
  Volume2,
  Sun,
  Moon,
  Hash,
  Tag as TagIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { roomsApi } from '@/lib/rooms-api';
import { jammingApi } from '@/lib/jamming-api';
import { useQuery } from '@tanstack/react-query';
import { formatTime, timeAgo } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Avatar from '@/components/Avatar';

interface Room {
  roomId: string;
  name: string;
  host: {
    _id: string;
    displayName: string;
    avatarUrl: string;
    publicSlug: string;
  };
  participantCount: number;
  participants: any[];
  currentTrack?: {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    spotifyUrl: string;
    durationMs: number;
  };
  lastPlayedTrack?: {
    trackId: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    playedAt: string;
    playedBy: {
      displayName: string;
      avatarUrl: string;
    };
  };
  tags?: string[];
  songHistoryCount?: number;
  hasFriends: boolean;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

// --- Segmented Toggle Component ---
function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex bg-gray-100 dark:bg-gray-800 rounded-full h-8 w-fit p-1">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 px-4 py-0.5 text-xs font-medium rounded-full transition-colors duration-150 focus:outline-none ${
            value === opt.value
              ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
          }`}
          style={{ minWidth: 0 }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function RoomDiscoveryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<'live' | 'recent'>(
    'live'
  );
  const [filter, setFilter] = useState<'all' | 'friends'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  // Fetch available tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: jammingApi.getTags,
    enabled: !!user,
  });

  const availableTags = tagsData?.data?.tags || [];
  const popularTags = availableTags.slice(0, 12); // Show top 12 most used tags

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    ];
    return colors[tag.length % colors.length];
  };

  // Fetch live rooms
  const {
    data: liveRoomsData,
    isLoading: liveLoading,
    error: liveError,
    refetch: refetchLive,
  } = useQuery({
    queryKey: ['live-rooms', filter, debouncedSearch, selectedTags],
    queryFn: () =>
      roomsApi.getDiscoveryRooms(
        filter,
        debouncedSearch || undefined,
        selectedTags.length > 0 ? selectedTags : undefined
      ),
    enabled: !!user && activeTab === 'live',
    refetchInterval: 10000, // Refresh every 10 seconds for live rooms
  });

  // Fetch recent rooms
  const {
    data: recentRoomsData,
    isLoading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ['recent-rooms', debouncedSearch, selectedTags],
    queryFn: () =>
      roomsApi.getRecentRooms(
        debouncedSearch || undefined,
        selectedTags.length > 0 ? selectedTags : undefined
      ),
    enabled: !!user && activeTab === 'recent',
    refetchInterval: 30000, // Refresh every 30 seconds for recent rooms
  });

  const liveRooms: Room[] = liveRoomsData?.data?.rooms || [];
  const recentRooms: Room[] = recentRoomsData?.data?.rooms || [];
  const currentRooms = activeTab === 'live' ? liveRooms : recentRooms;
  const isLoading =
    activeTab === 'live' ? liveLoading : recentLoading;
  const error = activeTab === 'live' ? liveError : recentError;

  const handleJoinRoom = (roomId: string) => {
    router.push(`/jam/${roomId}`);
  };

  const handleViewHistory = (roomId: string) => {
    router.push(`/jam/${roomId}/history`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Music Rooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to discover and join music rooms where
            people are listening together.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Log in with Spotify
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 hidden lg:block">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            People
          </h2>
          <div className="space-y-4">
            {currentRooms.slice(0, 5).map((room) => (
              <div
                key={room.roomId}
                className="flex items-center gap-3"
              >
                <img
                  src={room.host.avatarUrl}
                  alt={room.host.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {room.host.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {room.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {popularTags.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trending Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 8).map((tag: any) => (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTagColor(
                    tag.name
                  )}`}
                >
                  <Hash className="w-3 h-3" />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Responsive header row: toggle, input, theme icon (desktop: single row, mobile: split rows) */}
          <div className="flex flex-col gap-2 mb-4 w-full">
            {/* Desktop: single row, Mobile: split rows */}
            <div className="hidden sm:flex items-center justify-between w-full gap-4">
              {/* Live/Recent toggle (left) */}
              <div className="flex-shrink-0">
                <SegmentedToggle
                  options={[
                    { label: 'Live Rooms', value: 'live' },
                    { label: 'Recent Sessions', value: 'recent' },
                  ]}
                  value={activeTab}
                  onChange={(v) =>
                    setActiveTab(v as 'live' | 'recent')
                  }
                />
              </div>
              {/* Search input (center) */}
              <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rooms, users or categories"
                    className="w-full pl-10 pr-3 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-base"
                  />
                </div>
              </div>
              {/* Theme icon (right) */}
              <div className="flex-shrink-0">
                <button
                  onClick={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            {/* Mobile: toggle + theme icon row */}
            <div className="flex sm:hidden items-center justify-between w-full gap-2">
              <SegmentedToggle
                options={[
                  { label: 'Live Rooms', value: 'live' },
                  { label: 'Recent Sessions', value: 'recent' },
                ]}
                value={activeTab}
                onChange={(v) => setActiveTab(v as 'live' | 'recent')}
              />
              <button
                onClick={() =>
                  setTheme(theme === 'dark' ? 'light' : 'dark')
                }
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            {/* Mobile: search input row */}
            <div className="flex sm:hidden justify-center w-full">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms, users or categories"
                  className="w-full pl-10 pr-3 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-base"
                />
              </div>
            </div>
            {/* Friends/All toggle: sub-filter below main row */}
            {activeTab === 'live' && (
              <div className="flex w-full sm:w-auto mt-1">
                <SegmentedToggle
                  options={[
                    { label: 'All Rooms', value: 'all' },
                    { label: 'Friends Only', value: 'friends' },
                  ]}
                  value={filter}
                  onChange={(v) => setFilter(v as 'all' | 'friends')}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Tag Filters */}
        {popularTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1">
                <TagIcon className="w-3 h-3" /> Filter by Tags
              </h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={clearAllTags}
                  className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {popularTags.map((tag: any) => (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${getTagColor(tag.name)} ${selectedTags.includes(tag.name) ? 'ring-2 ring-purple-400' : ''}`}
                >
                  <Hash className="w-3 h-3" />
                  {tag.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rooms Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                  <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Failed to load rooms
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Something went wrong while fetching rooms.
              </p>
              <button
                onClick={() =>
                  activeTab === 'live'
                    ? refetchLive()
                    : refetchRecent()
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : currentRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'live' ? (
                  <Radio className="w-8 h-8 text-gray-400" />
                ) : (
                  <History className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery
                  ? 'No rooms found'
                  : `No ${activeTab} rooms found`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery
                  ? `No rooms match "${searchQuery}". Try a different search term.`
                  : selectedTags.length > 0
                  ? `No rooms found with the selected tags. Try different tags or clear filters.`
                  : activeTab === 'live'
                  ? filter === 'friends'
                    ? 'None of your friends are in active rooms right now.'
                    : 'No one is jamming right now. Be the first to start a room!'
                  : 'No recent sessions found. Rooms will appear here after they end.'}
              </p>
              {activeTab === 'live' && !searchQuery && (
                <Link
                  href="/jam"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start a Room
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {currentRooms.map((room, index) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    onJoin={handleJoinRoom}
                    onViewHistory={handleViewHistory}
                    delay={index * 0.07}
                    isLive={activeTab === 'live'}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Create Room CTA */}
        {currentRooms.length > 0 && activeTab === 'live' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <Link
              href="/jam"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-4 h-4" />
              Start Your Own Room
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- Redesigned RoomCard (compact, minimal, elegant) ---
function RoomCard({
  room,
  onJoin,
  onViewHistory,
  delay = 0,
  isLive = true,
}: {
  room: Room;
  onJoin: (roomId: string) => void;
  onViewHistory: (roomId: string) => void;
  delay?: number;
  isLive?: boolean;
}): React.ReactElement {
  // --- Data prep ---
  const trackToShow = room.currentTrack || room.lastPlayedTrack;
  const maxVisibleParticipants = 6;
  const visibleParticipants = room.participants.slice(
    0,
    maxVisibleParticipants
  );
  const remainingCount = Math.max(
    0,
    room.participantCount - maxVisibleParticipants
  );
  const category =
    room.tags && room.tags.length > 0 ? room.tags[0] : undefined;
  const moreTags =
    room.tags && room.tags.length > 1 ? room.tags.slice(1) : [];
  // Tag color logic (original)
  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    ];
    return colors[tag.length % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-3 flex flex-col min-h-[100px] w-full max-w-md mx-auto hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
          {room.name}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewHistory(room.roomId)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="View History"
          >
            <Clock className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => onJoin(room.roomId)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Join Room"
          >
            <Play className="w-4 h-4 text-purple-500" />
          </button>
        </div>
      </div>
      {room.participants && room.participants.length > 0 && (
        <div className="flex -space-x-3 mb-2">
          {visibleParticipants.map((p, i) => (
            <img key={i} src={p.avatarUrl} alt={p.displayName} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 shadow -ml-1" style={{ zIndex: visibleParticipants.length - i }} />
          ))}
          {remainingCount > 0 && (
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 border-2 border-white dark:border-gray-900 ml-1">+{remainingCount}</span>
          )}
        </div>
      )}
      {trackToShow && (
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={trackToShow.albumArt}
              alt={trackToShow.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {trackToShow.name}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {trackToShow.artist}
            </p>
          </div>
        </div>
      )}
      {room.tags && room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {room.tags.map((tag, index) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${getTagColor(
                tag
              )}`}
            >
              <Hash className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{room.songHistoryCount || 0} songs</span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {room.participantCount} listening
        </span>
        <span>{formatTime(room.currentTrack?.durationMs || 0)}</span>
      </div>
    </motion.div>
  );
}
