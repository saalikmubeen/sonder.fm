'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Music, Users, Radio, ArrowRight, Sparkles, Plus, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { jammingApi } from '@/lib/jamming-api';
import { Button } from '@sonder/ui';
import toast from 'react-hot-toast';

export default function JamPage() {
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  const cleanRoomName = (name: string) => {
    return name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  };

  const handleCreateAndJoinRoom = async () => {
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

      const cleanName = cleanRoomName(roomName);
      console.log(`Creating room: ${cleanName}`);

      // Step 1: Create the room
      const createResponse = await jammingApi.createRoom(cleanName);
      console.log('Create room response:', createResponse);

      if (!createResponse.success) {
        return;
      }

      // Step 2: Join the room
      const joinResponse = await jammingApi.joinRoom(cleanName);
      console.log('Join room response:', joinResponse);

      if (!joinResponse.success) {
        toast.error(joinResponse.error || 'Failed to join room after creation. Please try again.');
        setIsCreating(false);
        return;
      }

      toast.success('Room created and joined successfully!');
      router.push(`/jam/${cleanName}`);
    } catch (error: any) {
      console.error('Error creating/joining room:', error.response.data.error);
      toast.error(error.response.data.error || 'Failed to create and join room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
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
      const cleanName = cleanRoomName(roomName);
      console.log(`Joining room: ${cleanName}`);

      const joinResponse = await jammingApi.joinRoom(cleanName);
      console.log('Join room response:', joinResponse);

      if (!joinResponse.success) {
        toast.error(joinResponse.error || 'Failed to join room. Please check the name and try again.');
        setIsJoining(false);
        return;
      }

      toast.success('Joined room successfully!');
      router.push(`/jam/${cleanName}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Default to create on Enter key
      handleCreateAndJoinRoom();
    }
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
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Join the Jam
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in with Spotify to join jamming rooms and listen together with friends.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white"
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
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Jamming Rooms
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create or join a room to listen to music together in perfect sync.
            Share the vibe, share the moment.
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  disabled={isCreating || isJoining}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Create Room Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateAndJoinRoom}
                  disabled={isCreating || isJoining || !roomName.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
                  onClick={handleJoinRoom}
                  disabled={isCreating || isJoining || !roomName.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoining ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Create:</strong> Start a new room and become the host<br />
                <strong>Join:</strong> Enter an existing room as a listener
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
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Create or Join</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter a room name to join an existing room or create a new one.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Host Controls</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The room creator can search and play tracks from Spotify.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Sync & Enjoy</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Everyone listens together in perfect sync through their Spotify app.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 text-center"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </motion.div>
  );
}