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
  Loader2,
  Send,
  MessageCircle,
  X
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

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  message: string;
  timestamp: Date;
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

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socket = useJammingStore(state => state.socket);
  const hasJoinedRef = useRef(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Initialize room and socket connection
  useEffect(() => {
    if (!user || loading) return;

    const initializeRoom = async () => {
      try {
        setIsJoining(true);
        console.log(`Initializing room: ${roomId} for user: ${user.displayName}`);

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

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Chat event handlers
    const handleChatHistory = (messages: ChatMessage[]) => {
      setChatMessages(messages);
    };

    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    };

    const handleChatError = (error: { error: string }) => {
      toast.error(error.error);
    };

    const handleUserTyping = (data: { userId: string; displayName: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return; // Don't show own typing

      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.displayName);
        } else {
          newSet.delete(data.displayName);
        }
        return newSet;
      });
    };

    socket.on('chat_history', handleChatHistory);
    socket.on('chat_message', handleChatMessage);
    socket.on('chat_error', handleChatError);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('chat_history', handleChatHistory);
      socket.off('chat_message', handleChatMessage);
      socket.off('chat_error', handleChatError);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, user]);

  useJammingSocket(roomId, setRoom);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Only cleanup when component unmounts
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
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
        }
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [room?.playbackState.isPlaying, room?.currentTrack, room?.playbackState.positionMs, room?.playbackState.lastUpdated]);

  // Chat functions
  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !room) return;

    socket.emit('send_chat_message', {
      roomId: room.roomId,
      message: newMessage.trim(),
    });

    setNewMessage('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!socket || !room || isTyping) return;

    setIsTyping(true);
    socket.emit('typing_start', room.roomId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (!socket || !room || !isTyping) return;

    setIsTyping(false);
    socket.emit('typing_stop', room.roomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Host controls
  const handlePlay = () => {
    if (!isHost || !room || !socket || !room.currentTrack) return;
    if (room.playbackState.isPlaying) return;
    
    socket.emit('host_play', { roomId: room.roomId, trackId: room.currentTrack.id, positionMs: currentPosition });
  };

  const handlePause = () => {
    if (!isHost || !room || !socket) return;
    if (!room.playbackState.isPlaying) return;
    
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
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
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

  const isPlaying = room?.playbackState.isPlaying ?? false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-80' : ''}`}>
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

            <div className="flex items-center gap-4">
              {/* Chat Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-2 rounded-full transition-colors relative ${
                  isChatOpen 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {chatMessages.length > 0 && !isChatOpen && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                )}
              </motion.button>

              {/* Members */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {room.members.length}
                </span>
              </div>
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

      {/* Chat Sidebar */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-50"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Room Chat</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatMessagesRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100vh-140px)]"
            >
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.userId === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={message.avatarUrl}
                      alt={message.displayName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className={`flex-1 ${message.userId === user?.id ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {message.displayName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div
                        className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-[200px] break-words ${
                          message.userId === user?.id
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        {message.message}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </span>
                </motion.div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (e.target.value.trim() && !isTyping) {
                      handleTyping();
                    } else if (!e.target.value.trim() && isTyping) {
                      handleStopTyping();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {newMessage.length}/500
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}