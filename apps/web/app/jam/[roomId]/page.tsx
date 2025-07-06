'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  Search,
  Users,
  Crown,
  Music,
  Volume2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { jammingApi } from '@/lib/jamming-api';
import { formatDuration } from '@sonder/utils';
import toast from 'react-hot-toast';
import { useJammingSocket } from '@/lib/useJammingSocket';
import { useJammingStore } from '@/lib/jamming-store';
import Link from 'next/link';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  spotifyUrl: string;
  durationMs: number;
}

interface RoomMember {
  userId: string;
  spotifyId: string;
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
}

interface Room {
  roomId: string;
  hostId: string;
  hostSpotifyId: string;
  members: RoomMember[];
  currentTrack?: Track;
  playbackState: {
    isPlaying: boolean;
    positionMs: number;
    lastUpdated: string;
  };
  createdAt: string;
}

export default function JammingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const roomId = params.roomId as string;

  // Room state
  const [room, setRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Track search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Playback state
  const [currentPosition, setCurrentPosition] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const socket = useJammingStore(state => state.socket);
  const hasJoinedRef = useRef(false);

  // Initialize room and socket connection
  useEffect(() => {
    if (!user || loading) return;

    const initializeRoom = async () => {
      try {
        setIsJoining(true);
        console.log(`Initializing room: ${roomId} for user: ${user.displayName}`);
        console.log('🎵 User object:', {
          displayName: user.displayName,
          hasAccessToken: !!user.accessToken,
          accessTokenLength: user.accessToken?.length
        });

        // Add a small delay to ensure room is fully created if coming from create flow
        await new Promise(resolve => setTimeout(resolve, 500));

        // First, join the room via API
        console.log(`Attempting to join room: ${roomId}`);
        const response = await jammingApi.joinRoom(roomId);
        console.log(`Join room response:`, response);

        if (response.success) {
          setRoom(response.data.room);
          setIsHost(response.data.isHost);

          // Set initial playback state
          if (response.data.room.playbackState) {
            setCurrentPosition(response.data.room.playbackState.positionMs);
          }
        }
      } catch (error: any) {
        console.error('Error joining room:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        if (error.response?.status === 404) {
          setRoomError('Room not found. It may have been deleted or never existed.');
          toast.error('Room not found. Please create a new room from the main jam page.');
        } else {
          setRoomError(error.response?.data?.error || 'Failed to join room');
          toast.error('Failed to join room. Please try again.');
        }
      } finally {
        setIsJoining(false);
      }
    };

    initializeRoom();
  }, [user, loading, roomId]);

  useEffect(() => {
    if (room && socket && !hasJoinedRef.current) {
      console.log("Emitting Join room", room.roomId)
      socket.emit('join_room', room.roomId);
      hasJoinedRef.current = true;
    }
  }, [room, socket]);

  useJammingSocket(roomId, setRoom);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Only cleanup when component unmounts
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []); // Empty dependency array - only runs on unmount

  // Progress tracking
  useEffect(() => {
    if (room?.currentTrack) {
      // Calculate real current position using lastUpdated
      let realPosition = room.playbackState.positionMs;
      if (room.playbackState.isPlaying && room.playbackState.lastUpdated) {
        const lastUpdated = new Date(room.playbackState.lastUpdated).getTime();
        const now = Date.now();
        const elapsed = Math.max(0, now - lastUpdated);
        realPosition = Math.min(
          room.playbackState.positionMs + elapsed,
          room.currentTrack.durationMs
        );
      }
      setCurrentPosition(realPosition);
      console.log('Progress effect: isPlaying', room.playbackState.isPlaying, 'currentPosition', realPosition);
      if (room.playbackState.isPlaying) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        progressInterval.current = setInterval(() => {
          setCurrentPosition(prev => {
            const newPosition = prev + 1000;
            return newPosition > room.currentTrack!.durationMs ? room.currentTrack!.durationMs : newPosition;
          });
        }, 1000);
      } else {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
          console.log('Progress interval cleared due to pause');
        }
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
        console.log('Progress interval cleaned up on effect cleanup');
      }
    };
  }, [room?.playbackState.isPlaying, room?.currentTrack, room?.playbackState.positionMs, room?.playbackState.lastUpdated]);

  // Host controls
  const handlePlay = () => {
    if (!isHost || !room || !socket || !room.currentTrack) return;
    if (room.playbackState.isPlaying) return; // Prevent repeated play events
    // Log the current position before emitting
    console.log('Play: currentPosition', currentPosition);
    // Emit play event to backend
    socket.emit('host_play', { roomId: room.roomId, trackId: room.currentTrack.id, positionMs: currentPosition });
  };

  const handlePause = () => {
    if (!isHost || !room || !socket) return;
    if (!room.playbackState.isPlaying) return; // Prevent repeated pause events
    // Calculate the latest position before pausing
    let latestPosition = currentPosition;
    if (room.playbackState.isPlaying && room.playbackState.lastUpdated) {
      const lastUpdated = new Date(room.playbackState.lastUpdated).getTime();
      const now = Date.now();
      const elapsed = Math.max(0, now - lastUpdated);
      latestPosition = Math.min(
        room.playbackState.positionMs + elapsed,
        room.currentTrack!.durationMs
      );
      setCurrentPosition(latestPosition);
    }
    // Clear interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    // Log the current position before emitting
    console.log('Pause: currentPosition', latestPosition);
    // Emit pause event to backend
    socket.emit('host_pause', { roomId: room.roomId, positionMs: latestPosition });
  };

  const handleSeek = (positionMs: number) => {
    if (!isHost || !room) return;

    setCurrentPosition(positionMs);
  };

  // Track search
  const searchTracks = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await jammingApi.searchTracks(searchQuery);
      if (response.success) {
        setSearchResults(response.data.tracks);
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast.error('Failed to search tracks');
    } finally {
      setIsSearching(false);
    }
  };

  const selectTrack = (track: Track) => {
    if (!isHost || !room || !socket) return;
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    // Emit to backend: host wants to play this track
    socket.emit('host_play', { roomId: room.roomId, trackId: track.id, positionMs: 0 });
  };

  // Leave room
  const handleLeaveRoom = async () => {
    try {
      await jammingApi.leaveRoom(roomId);
      router.push('/jam');
    } catch (error) {
      console.error('Error leaving room:', error);
      router.push('/jam');
    }
  };

  if (loading || isJoining) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Loading...' : 'Joining room...'}
          </p>
        </motion.div>
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
          <Music className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in with Spotify to join jamming rooms.
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

  if (roomError || !room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Room Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {roomError || 'Failed to load room'}
          </p>
          <button
            onClick={() => router.push('/jam')}
            className="px-6 py-3 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors"
          >
            Back to Jamming
          </button>
        </motion.div>
      </div>
    );
  }

  const progressPercent = room?.currentTrack
    ? (currentPosition / room.currentTrack.durationMs) * 100
    : 0;

  // Always derive isPlaying from backend room state
  const isPlaying = room?.playbackState.isPlaying ?? false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLeaveRoom}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {roomId}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isHost ? 'You are the host' : `Hosted by ${room.members.find(m => m.userId === room.hostId)?.displayName}`}
              </p>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {room.members.length}
            </span>
          </div>
        </motion.div>

        {/* Current Track */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8 mb-8"
        >
          {room.currentTrack ? (
            <div className="flex items-center gap-6">
              <motion.img
                animate={isPlaying ? { rotate: [0, 5, -5, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                src={room.currentTrack.albumArt}
                alt={room.currentTrack.album}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate mb-2">
                  {room.currentTrack.name}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 truncate mb-1">
                  {room.currentTrack.artist}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {room.currentTrack.album}
                </p>

                {/* Progress Bar */}
                <div className="mt-4 space-y-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatDuration(currentPosition)}</span>
                    <span>{formatDuration(room.currentTrack.durationMs)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                {/* Playback Controls (Host Only) */}
                {isHost && room?.currentTrack && (
                  <button
                    onClick={room.playbackState.isPlaying ? handlePause : handlePlay}
                    className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
                    aria-label={room.playbackState.isPlaying ? 'Pause' : 'Play'}
                  >
                    {room.playbackState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                )}

                {/* Spotify Link */}
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href={room.currentTrack.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Spotify
                </motion.a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No track selected
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isHost ? 'Search and select a track to start jamming' : 'Waiting for the host to select a track'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Host Controls */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Host Controls
              </h3>
            </div>

            {/* Search */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                    placeholder="Search for tracks..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={searchTracks}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </motion.button>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 max-h-64 overflow-y-auto"
                  >
                    {searchResults.map((track) => (
                      <motion.button
                        key={track.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => selectTrack(track)}
                        className="w-full flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <img
                          src={track.albumArt}
                          alt={track.album}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {track.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDuration(track.durationMs)}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Room Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Room Members ({room.members.length})
          </h3>

          <div className="space-y-3">
            {room.members.map((member) => (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <img
                  src={member.avatarUrl}
                  alt={member.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/u/${member.publicSlug}`}
                      className="font-medium text-gray-900 dark:text-white hover:underline"
                    >
                      {member.displayName}
                    </Link>
                    {member.userId === room.hostId && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    @{member.spotifyId}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}