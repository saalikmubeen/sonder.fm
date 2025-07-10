'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Music,
  ExternalLink,
  Download,
  Play,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { roomsApi } from '@/lib/rooms-api';
import { timeAgo, formatTime } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface RoomHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

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

export default function RoomHistoryModal({
  isOpen,
  onClose,
  roomId,
}: RoomHistoryModalProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');

  // Fetch room history
  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['room-history', roomId],
    queryFn: () => roomsApi.getRoomHistory(roomId),
    enabled: isOpen,
  });

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-800"
            >
              {/* Header */}
              <div className="relative p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Room History
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Songs played in this room
                    </p>
                  </div>
                </div>

                {/* Export Button */}
                {history.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {exportMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export to Spotify Playlist
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto max-h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
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
                ) : error ? (
                  <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Music className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Failed to load history
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Something went wrong while fetching the room
                      history.
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : history.length === 0 ? (
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
                          {/* Album Art */}
                          <div className="relative">
                            <img
                              src={item.albumArt}
                              alt={item.album}
                              className="w-12 h-12 rounded-lg object-cover shadow-md"
                            />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {index + 1}
                            </div>
                          </div>

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
                            <Link
                              href={`/u/${item.playedBy.publicSlug}`}
                            >
                              <motion.img
                                whileHover={{ scale: 1.1 }}
                                src={item.playedBy.avatarUrl}
                                alt={item.playedBy.displayName}
                                className="w-8 h-8 rounded-full object-cover"
                                title={`Played by ${item.playedBy.displayName}`}
                              />
                            </Link>
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
          </motion.div>

          {/* Export Modal */}
          <AnimatePresence>
            {showExportModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
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
                        onChange={(e) =>
                          setPlaylistName(e.target.value)
                        }
                        placeholder={`Room ${roomId} - Sonder.fm`}
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
                        placeholder={`Exported from Sonder.fm room on ${new Date().toLocaleDateString()}`}
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
        </>
      )}
    </AnimatePresence>
  );
}
