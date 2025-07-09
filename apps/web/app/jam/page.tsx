'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Music,
  Users,
  Radio,
  ArrowRight,
  Sparkles,
  Plus,
  LogIn,
  X,
  Hash,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { jammingApi } from '@/lib/jamming-api';
import { Button } from '@sonder/ui';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

export default function JamPage() {
  const [roomName, setRoomName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showRoomList, setShowRoomList] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Predefined tags
  const predefinedTags = [
    {
      name: 'lofi',
      color:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    },
    {
      name: 'grunge',
      color:
        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    },
    {
      name: 'sadcore',
      color:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    },
    {
      name: 'party',
      color:
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    },
    {
      name: 'chill',
      color:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    {
      name: 'rainy day',
      color:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    },
    {
      name: 'study',
      color:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
    {
      name: 'workout',
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    },
    {
      name: 'jazz',
      color:
        'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    },
    {
      name: 'electronic',
      color:
        'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    },
  ];

  // Fetch existing tags for autocomplete
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: jammingApi.getTags,
    enabled: !!user,
  });

  const existingTags = tagsData?.data?.tags || [];

  const handleCreateRoom = async () => {
    if (!user) {
      toast.error('Please log in to create a jamming room');
      return;
    }
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }
    setIsCreating(true);
    try {
      const createResponse = await jammingApi.createRoom(
        roomName.trim(),
        selectedTags
      );
      if (!createResponse.success) {
        toast.error(createResponse.error || 'Failed to create room.');
        setIsCreating(false);
        return;
      }
      const newRoomId = createResponse.data.roomId;
      // Join the new room
      const joinResponse = await jammingApi.joinRoom(newRoomId);
      if (!joinResponse.success) {
        toast.error(
          joinResponse.error || 'Failed to join room after creation.'
        );
        setIsCreating(false);
        return;
      }
      toast.success('Room created and joined successfully!');
      router.push(`/jam/${newRoomId}`);
    } catch (error: any) {
      toast.error(
        'Failed to create and join room. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.toLowerCase().trim();
    if (
      cleanTag &&
      !selectedTags.includes(cleanTag) &&
      selectedTags.length < 5
    ) {
      setSelectedTags([...selectedTags, cleanTag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const addCustomTag = () => {
    if (
      customTag.trim() &&
      customTag.length <= 20 &&
      /^[a-zA-Z0-9\s\-]+$/.test(customTag)
    ) {
      addTag(customTag);
      setCustomTag('');
    } else {
      toast.error(
        'Tag must be 1-20 characters and contain only letters, numbers, spaces, and hyphens'
      );
    }
  };

  const getTagColor = (tag: string) => {
    const predefined = predefinedTags.find((t) => t.name === tag);
    return (
      predefined?.color ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    );
  };

  const handleJoinRoomSearch = async () => {
    if (!user) {
      toast.error('Please log in to join a jamming room');
      return;
    }
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }
    setIsJoining(true);
    try {
      const searchResponse = await jammingApi.searchRoomsByName(
        roomName.trim()
      );
      const rooms = searchResponse?.data?.rooms || [];
      setSearchResults(rooms);
      setShowRoomList(true);
    } catch (error: any) {
      toast.error('Failed to search for rooms. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setIsJoining(true);
    try {
      const joinResponse = await jammingApi.joinRoom(roomId);
      if (!joinResponse.success) {
        toast.error(joinResponse.error || 'Failed to join room.');
        setIsJoining(false);
        return;
      }
      toast.success('Joined room successfully!');
      router.push(`/jam/${roomId}`);
    } catch (error: any) {
      toast.error('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
      setShowRoomList(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoomSearch();
    }
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
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Join the Jam
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in with Spotify to join jamming rooms and
            listen together with friends.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors text-white mx-auto"
          >
            Log in with Spotify
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-12 h-12  bg-gradient-to-r from-purple-500 to-pink-500  rounded-full flex items-center justify-center mx-auto mb-4">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Jamming Rooms
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create or join a room to listen to music together in
            perfect sync. Share the vibe, share the moment.
          </p>
        </motion.div>

        {/* Room Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8 mb-12"
        >
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Create or Join a Room
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter room name (e.g., 'chill-vibes')"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  disabled={isCreating || isJoining}
                />
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tags (optional) - Help others discover your vibe
                </label>

                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((tag) => (
                      <motion.span
                        key={tag}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getTagColor(
                          tag
                        )}`}
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Predefined Tags */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Popular tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {predefinedTags.map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => addTag(tag.name)}
                        disabled={
                          selectedTags.includes(tag.name) ||
                          selectedTags.length >= 5
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedTags.includes(tag.name)
                            ? tag.color + ' ring-2 ring-green-500'
                            : tag.color +
                              ' hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                        }`}
                      >
                        <Hash className="w-3 h-3" />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tag Input */}
                {selectedTags.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' && addCustomTag()
                      }
                      placeholder="Add custom tag..."
                      maxLength={20}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-sm"
                      disabled={isCreating || isJoining}
                    />
                    <button
                      onClick={addCustomTag}
                      disabled={
                        !customTag.trim() || isCreating || isJoining
                      }
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Max 5 tags • 20 characters each • Letters, numbers,
                  spaces, and hyphens only
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Create Room Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateRoom}
                  disabled={
                    isCreating || isJoining || !roomName.trim()
                  }
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white  rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create
                    </>
                  )}
                </motion.button>
                {/* Join Room Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoinRoomSearch}
                  disabled={
                    isCreating || isJoining || !roomName.trim()
                  }
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoining ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Join
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Room List Modal */}
            {showRoomList && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                    Rooms named "{roomName.trim()}"
                  </h3>
                  {searchResults.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                      No active rooms found.
                    </div>
                  ) : (
                    <ul className="mb-4 max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800">
                      {searchResults.map((room) => (
                        <li
                          key={room.roomId}
                          className="py-2 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Host:{' '}
                              {room.host?.displayName || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Users: {room.participantCount} •
                              Created:{' '}
                              {new Date(
                                room.createdAt
                              ).toLocaleString()}
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              handleJoinRoom(room.roomId)
                            }
                            className="ml-2 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                            disabled={isJoining}
                          >
                            Join
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-between gap-2">
                    <Button
                      onClick={() => setShowRoomList(false)}
                      className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Create:</strong> Start a new room and become
                the host
                <br />
                <strong>Join:</strong> Enter an existing room as a
                listener
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <FeatureCard
            icon={<Music className="w-6 h-6" />}
            title="Synchronized Playback"
            description="Listen to the same song at the exact same time with perfect sync across all devices."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Host Controls"
            description="The room creator controls playback. Everyone else enjoys the shared musical journey."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Temporary Rooms"
            description="Rooms are ephemeral - they exist only while you're jamming together."
          />
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            How It Works
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  1
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Create or Join
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter a room name to join an existing room or create a
                new one.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  2
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Host Controls
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The room creator can search and play tracks from
                Spotify.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  3
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Sync & Enjoy
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Everyone listens together in perfect sync through
                their Spotify app.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 text-center"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </motion.div>
  );
}
