'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { roomsApi } from '@/lib/rooms-api';
import { useQuery } from '@tanstack/react-query';
import { formatTime, timeAgo } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  hasFriends: boolean;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

export default function RoomDiscoveryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'friends'>('all');

  const {
    data: roomsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['discovery-rooms', filter],
    queryFn: () => roomsApi.getDiscoveryRooms(filter),
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const rooms: Room[] = roomsData?.data?.rooms || [];

  const handleJoinRoom = (roomId: string) => {
    router.push(`/jam/${roomId}`);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Discover Rooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join live music rooms where people are listening together in perfect sync.
            Find friends or discover new vibes.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Rooms
            </h2>
            <button
              onClick={() => refetch()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {[
              { id: 'all', label: 'All Rooms', icon: Music },
              { id: 'friends', label: 'Friends Only', icon: Heart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as 'all' | 'friends')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Rooms Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
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
                onClick={() => refetch()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Radio className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No active rooms found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {filter === 'friends'
                  ? "None of your friends are in active rooms right now."
                  : "No one is jamming right now. Be the first to start a room!"}
              </p>
              <Link
                href="/jam"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start a Room
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatePresence>
                {rooms.map((room, index) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    onJoin={handleJoinRoom}
                    delay={index * 0.1}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Create Room CTA */}
        {rooms.length > 0 && (
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
  delay = 0,
}: {
  room: Room;
  onJoin: (roomId: string) => void;
  delay?: number;
}) {
  const trackToShow = room.currentTrack || room.lastPlayedTrack;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 group"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={`/u/${room.host.publicSlug}`}>
              <motion.img
                whileHover={{ scale: 1.1 }}
                src={room.host.avatarUrl}
                alt={room.host.displayName}
                className="w-12 h-12 rounded-full object-cover shadow-lg"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/u/${room.host.publicSlug}`}
                  className="font-semibold text-gray-900 dark:text-white hover:underline"
                >
                  {room.host.displayName}
                </Link>
                <Crown className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Room: {room.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {room.hasFriends && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center"
                title="Friends in room"
              >
                <Heart className="w-3 h-3 text-yellow-600 dark:text-yellow-400 fill-current" />
              </motion.div>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{room.participantCount}</span>
            </div>
          </div>
        </div>

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
                {room.currentTrack ? (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                    <Pause className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {trackToShow.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {trackToShow.artist}
                </p>
                {!room.currentTrack && room.lastPlayedTrack && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Last played {timeAgo(new Date(room.lastPlayedTrack.playedAt))}
                  </p>
                )}
              </div>
              {room.currentTrack && (
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                  LIVE
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 text-center">
            <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No music playing yet
            </p>
          </div>
        )}

        {/* Join Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onJoin(room.roomId)}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-105"
        >
          <Play className="w-4 h-4" />
          Join Room
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Active {timeAgo(new Date(room.lastActive))}</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{room.isActive ? 'Live' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}