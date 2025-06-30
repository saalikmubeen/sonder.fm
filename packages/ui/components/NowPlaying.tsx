import React from 'react';
import { motion } from 'framer-motion';
import { Music, Pause, Play } from 'lucide-react';
import type { NowPlaying as NowPlayingType } from '@sonder/types';
import { formatDuration } from '@sonder/utils';

interface NowPlayingProps {
  nowPlaying: NowPlayingType | null;
  showProgress?: boolean;
  compact?: boolean;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  nowPlaying,
  showProgress = true,
  compact = false
}) => {
  if (!nowPlaying) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 text-gray-500"
      >
        <Music className="w-5 h-5" />
        <span className="text-sm">Not listening to anything</span>
      </motion.div>
    );
  }

  const progressPercent = (nowPlaying.progressMs / nowPlaying.durationMs) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${compact ? 'space-y-2' : 'space-y-4'}`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={nowPlaying.isPlaying ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <img
            src={nowPlaying.albumArt}
            alt={nowPlaying.album}
            className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg object-cover shadow-lg`}
          />
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
            {nowPlaying.isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <motion.h3
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className={`font-semibold text-gray-900 dark:text-white truncate ${
              compact ? 'text-sm' : 'text-base'
            }`}
          >
            {nowPlaying.song}
          </motion.h3>
          <motion.p
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-gray-600 dark:text-gray-400 truncate ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            {nowPlaying.artist}
          </motion.p>
          {!compact && (
            <motion.p
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-gray-500 truncate"
            >
              {nowPlaying.album}
            </motion.p>
          )}
        </div>
      </div>

      {showProgress && !compact && (
        <div className="space-y-1">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatDuration(nowPlaying.progressMs)}</span>
            <span>{formatDuration(nowPlaying.durationMs)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};