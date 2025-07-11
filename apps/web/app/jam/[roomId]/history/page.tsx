'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Music,
  ExternalLink,
  Download,
  User,
  Calendar,
  Loader2,
  Crown,
  Users,
  Play,
  Share,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { roomsApi } from '@/lib/rooms-api';
import { timeAgo, formatTime } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import BackButton from '@/components/BackButton';

interface HistoryItem {
  _id: string;
  trackId: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  spotifyUrl: string;
  durationMs: number;
  playedAt: string;
  playedBy: {
    _id: string;
    displayName: string;
    avatarUrl: string;
    publicSlug: string;
  };
}

interface RoomDetails {
  roomId: string;
  name: string;
  host: {
    _id: string;
    displayName: string;
    avatarUrl: string;
    publicSlug: string;
  };
  participants: any[];
  participantCount: number;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

export default function RoomHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.roomId as string;

  const [showExportModal, setShowExportModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');

  // Fetch room details
  const {
    data: roomData,
    isLoading: roomLoading,
    error: roomError,
  } = useQuery({
    queryKey: ['room-details', roomId],
    queryFn: () => roomsApi.getRoomDetails(roomId),
    enabled: !!roomId,
  });

  // Fetch room history
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['room-history', roomId],
    queryFn: () => roomsApi.getRoomHistory(roomId),
    enabled: !!roomId,
  });

  const room: RoomDetails | null = roomData?.data?.room || null;
  const history: HistoryItem[] = historyData?.data?.history || [];

  // Export playlist mutation
  const exportMutation = useMutation({
    mutationFn: ({
      name,
      description,
    }: {
      name?: string;
      description?: string;
    }) => roomsApi.exportPlaylist(roomId, name, description),
    onSuccess: (data) => {
      toast.success('Playlist exported to Spotify! 🎵');
      setShowExportModal(false);
      setPlaylistName('');
      setPlaylistDescription('');

      // Open Spotify playlist
      if (data.data.playlist.url) {
        window.open(data.data.playlist.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Failed to export playlist'
      );
    },
  });

  const handleExport = () => {
    if (history.length === 0) {
      toast.error('No songs to export');
      return;
    }
    setShowExportModal(true);
  };

  const handleConfirmExport = () => {
    exportMutation.mutate({
      name: playlistName.trim() || undefined,
      description: playlistDescription.trim() || undefined,
    });
  };

  const handleJoinRoom = () => {
    if (room?.isActive) {
      router.push(`/jam/${roomId}`);
    } else {
      toast.error('This room has ended');
    }
  };

  if (roomLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (roomError || historyError || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Room Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This room doesn't exist or you don't have permission to
            view it.
          </p>
          <button
            onClick={() => router.push('/jam/discover')}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-medium hover:bg-purple-700 transition-colors"
          >
            Back to Discovery
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
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-5 mb-6"
        >
          <div className="flex items-center gap-4 mb-5">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {room.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Room History • {history.length} songs played
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  room.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {room.isActive ? 'Active' : 'Ended'}
              </span>
            </div>
          </div>

          {/* Room Info */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            {/* Host Info */}
            <div className="flex items-center gap-3">
              <Link href={`/u/${room.host.publicSlug}`}>
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={room.host.avatarUrl}
                  alt={room.host.displayName}
                  className="w-14 h-14 rounded-full object-cover shadow-lg"
                />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Hosted by
                  </span>
                </div>
                <Link
                  href={`/u/${room.host.publicSlug}`}
                  className="font-semibold text-gray-900 dark:text-white hover:underline"
                >
                  {room.host.displayName}
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {room.participantCount} participants
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Created {timeAgo(new Date(room.createdAt))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last active {timeAgo(new Date(room.lastActive))}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {room.isActive && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Join Room
              </motion.button>
            )}

            {history.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exportMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export Playlist
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Song History
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chronological order of songs played
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No history yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Songs played in this room will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {history.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Track Number */}
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400">
                        {index + 1}
                      </div>

                      {/* Album Art */}
                      <img
                        src={item.albumArt}
                        alt={item.album}
                        className="w-12 h-12 rounded-lg object-cover shadow-md"
                      />

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {item.artist}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {timeAgo(new Date(item.playedAt))}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTime(item.durationMs)}
                          </div>
                        </div>
                      </div>

                      {/* Played By */}
                      <div className="flex items-center gap-2">
                        <Link href={`/u/${item.playedBy.publicSlug}`}>
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            src={item.playedBy.avatarUrl}
                            alt={item.playedBy.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                            title={`Played by ${item.playedBy.displayName}`}
                          />
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <div>Played by</div>
                          <div className="font-medium">
                            {item.playedBy.displayName}
                          </div>
                        </div>
                      </div>

                      {/* Spotify Link */}
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        href={item.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Open in Spotify"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </motion.a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Export to Spotify
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Playlist Name (optional)
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder={`${room.name} - Sonder.fm`}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={playlistDescription}
                    onChange={(e) =>
                      setPlaylistDescription(e.target.value)
                    }
                    placeholder={`Exported from Sonder.fm room "${
                      room.name
                    }" on ${new Date().toLocaleDateString()}`}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This will create a private playlist with{' '}
                  {history.length} songs in your Spotify account.
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmExport}
                  disabled={exportMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {exportMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
