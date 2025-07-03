'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, Music, Clock } from 'lucide-react';
import { formatTime } from '@sonder/utils';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caption: string) => void;
  trackInfo: {
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    timestampMs: number;
  };
  loading?: boolean;
}

export default function BookmarkModal({
  isOpen,
  onClose,
  onSave,
  trackInfo,
  loading = false,
}: BookmarkModalProps) {
  const [caption, setCaption] = useState('');

  const handleSave = () => {
    onSave(caption);
    setCaption('');
  };

  const handleClose = () => {
    setCaption('');
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-800"
            >
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Bookmark This Moment
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Save this special moment in the song
                    </p>
                  </div>
                </div>
              </div>

              {/* Track Info */}
              <div className="px-6 pb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-4">
                  <img
                    src={trackInfo.albumArt}
                    alt={trackInfo.album}
                    className="w-16 h-16 rounded-lg object-cover shadow-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {trackInfo.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {trackInfo.artist}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        {formatTime(trackInfo.timestampMs)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption Input */}
              <div className="px-6 pb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Add a caption (optional)
                </label>
                <div className="relative">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What makes this moment special? Share your thoughts..."
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {caption.length}/500
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      Save Bookmark
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}