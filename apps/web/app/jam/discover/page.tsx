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

export default function RoomDiscoveryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'live' | 'recent'>('live');
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
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
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
    queryFn: () => roomsApi.getDiscoveryRooms(
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
    queryFn: () => roomsApi.getRecentRooms(
      debouncedSearch || undefined,
      selectedTags.length > 0 ? selectedTags : undefined
    ),
    enabled: !!user && activeTab === 'recent',
    refetchInterval: 30000, // Refresh every 30 seconds for recent rooms
  });

  const liveRooms: Room[] = liveRoomsData?.data?.rooms || [];
  const recentRooms: Room[] = recentRoomsData?.data?.rooms || [];
  const currentRooms = activeTab === 'live' ? liveRooms : recentRooms;
  const isLoading = activeTab === 'live' ? liveLoading : recentLoading;
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
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Music Rooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to discover and join music rooms where people are listening together.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors"
          >
            Log in with Spotify
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Radio className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Discover Rooms
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Join live music rooms or explore recent sessions
                </p>
              </div>
            </div>
            
            {/* Theme Toggle */}
            {mounted && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms by name or host..."
              className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-lg"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Browse Rooms
            </h2>
            <button
              onClick={() => activeTab === 'live' ? refetchLive() : refetchRecent()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Main Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
            {[
              { id: 'live', label: 'Live Rooms', icon: Radio, count: liveRooms.length },
              { id: 'recent', label: 'Recent Sessions', icon: History, count: recentRooms.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'live' | 'recent')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Tabs (only for live rooms) */}
          {activeTab === 'live' && (
            <div className="flex bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
              {[
                { id: 'all', label: 'All Rooms', icon: Music },
                { id: 'friends', label: 'Friends Only', icon: Heart },
              ].map((filterTab) => (
                <button
                  key={filterTab.id}
                  onClick={() => setFilter(filterTab.id as 'all' | 'friends')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium transition-all text-sm ${
                    filter === filterTab.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <filterTab.icon className="w-4 h-4" />
                  {filterTab.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tag Filters */}
        {popularTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                Filter by Tags
              </h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={clearAllTags}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {selectedTags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag)} ring-2 ring-green-500`}
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}

            {/* Available Tags */}
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                    selectedTags.includes(tag.name)
                      ? getTagColor(tag.name) + ' ring-2 ring-green-500'
                      : getTagColor(tag.name) + ' hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  {tag.name}
                  <span className="text-xs opacity-60">({tag.usageCount})</span>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 animate-pulse"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
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
                onClick={() => activeTab === 'live' ? refetchLive() : refetchRecent()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                {searchQuery ? 'No rooms found' : `No ${activeTab} rooms found`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery 
                  ? `No rooms match "${searchQuery}". Try a different search term.`
                  : selectedTags.length > 0
                    ? `No rooms found with the selected tags. Try different tags or clear filters.`
                  : activeTab === 'live'
                    ? filter === 'friends'
                      ? "None of your friends are in active rooms right now."
                      : "No one is jamming right now. Be the first to start a room!"
                    : "No recent sessions found. Rooms will appear here after they end."
                }
              </p>
              {activeTab === 'live' && !searchQuery && (
                <Link
                  href="/jam"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start a Room
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {currentRooms.map((room, index) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    onJoin={handleJoinRoom}
                    onViewHistory={handleViewHistory}
                    delay={index * 0.1}
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
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
}) {
  const trackToShow = room.currentTrack || room.lastPlayedTrack;
  const maxVisibleParticipants = 6;
  const visibleParticipants = room.participants.slice(0, maxVisibleParticipants);
  const remainingCount = Math.max(0, room.participantCount - maxVisibleParticipants);

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    ];
    return colors[tag.length % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 group relative"
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </motion.div>
        </div>
      )}

      {/* Friends Indicator */}
      {room.hasFriends && (
        <div className="absolute top-4 right-4 z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center shadow-lg"
            title="Friends in room"
          >
            <Heart className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
          </motion.div>
        </div>
      )}

      <div className="p-6">
        {/* Host Info */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/u/${room.host.publicSlug}`}>
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={room.host.avatarUrl}
              alt={room.host.displayName}
              className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white dark:border-gray-700"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/u/${room.host.publicSlug}`}
                className="font-semibold text-gray-900 dark:text-white hover:underline truncate"
              >
                {room.host.displayName}
              </Link>
              <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {room.name}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {room.participantCount} {room.participantCount === 1 ? 'person' : 'people'} 
              {isLive ? ' listening' : ' listened'}
            </span>
          </div>
          
          {/* Participant Avatars */}
          <div className="flex items-center gap-1">
            {visibleParticipants.map((participant, index) => (
              <motion.img
                key={participant._id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + index * 0.05 }}
                src={participant.avatarUrl}
                alt={participant.displayName}
                className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                title={participant.displayName}
                style={{ marginLeft: index > 0 ? '-8px' : '0' }}
              />
            ))}
            {remainingCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + visibleParticipants.length * 0.05 }}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 shadow-sm"
                style={{ marginLeft: '-8px' }}
              >
                +{remainingCount}
              </motion.div>
            )}
          </div>
        </div>

        {/* Tags */}
        {room.tags && room.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {room.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                >
                  <Hash className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
              {room.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  +{room.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current/Last Track */}
        {trackToShow ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={trackToShow.albumArt}
                  alt={trackToShow.album}
                  className="w-12 h-12 rounded-lg object-cover shadow-md"
                />
                {isLive && room.currentTrack ? (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Volume2 className="w-2 h-2 text-white" />
                  </div>
                ) : (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                    <Pause className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                  {trackToShow.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {trackToShow.artist}
                </p>
                {!isLive && room.lastPlayedTrack && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(new Date(room.lastPlayedTrack.playedAt))}
                  </p>
                )}
              </div>
              {isLive && room.currentTrack && (
                <div className="text-xs text-green-600 dark:text-green-400 font-bold">
                  NOW
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 text-center">
            <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLive ? 'No music playing yet' : 'No tracks recorded'}
            </p>
          </div>
        )}

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => isLive ? onJoin(room.roomId) : onViewHistory(room.roomId)}
          className={`w-full px-4 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-105 ${
            isLive
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
          }`}
        >
          {isLive ? (
            <>
              <Play className="w-4 h-4" />
              Join Room
            </>
          ) : (
            <>
              <History className="w-4 h-4" />
              View History
              {room.songHistoryCount && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {room.songHistoryCount} songs
                </span>
              )}
            </>
          )}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {isLive ? 'Active' : 'Ended'} {timeAgo(new Date(room.lastActive))}
          </span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isLive ? 'Live' : 'Ended'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}