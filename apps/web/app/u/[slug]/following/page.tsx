'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, MessageSquare, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { followApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
  profileTheme: string;
}

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const slug = params.slug as string;
  const initialTab = searchParams.get('tab') || 'followers';
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    initialTab as 'followers' | 'following'
  );

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to view followers');
      router.push(`/u/${slug}`);
    }
  }, [user, router, slug]);

  // Fetch followers
  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['followers', slug],
    queryFn: () => followApi.getFollowers(slug),
    enabled: !!user && activeTab === 'followers',
  });

  // Fetch following
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following', slug],
    queryFn: () => followApi.getFollowing(slug),
    enabled: !!user && activeTab === 'following',
  });

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: (targetSlug: string) => followApi.follow(targetSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', slug] });
      queryClient.invalidateQueries({ queryKey: ['following', slug] });
      toast.success('Following user ✨');
    },
    onError: () => toast.error('Failed to follow user'),
  });

  const unfollowMutation = useMutation({
    mutationFn: (targetSlug: string) => followApi.unfollow(targetSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', slug] });
      queryClient.invalidateQueries({ queryKey: ['following', slug] });
      toast.success('Unfollowed user');
    },
    onError: () => toast.error('Failed to unfollow user'),
  });

  const followers: User[] = followersData?.data?.followers || [];
  const following: User[] = followingData?.data?.following || [];
  const isOwnProfile = user?.publicSlug === slug;

  const handleFollowToggle = async (targetUser: User) => {
    if (!user) {
      toast.error('Please log in to follow users');
      return;
    }

    if (targetUser.publicSlug === user.publicSlug) {
      toast.error('You cannot follow yourself');
      return;
    }

    try {
      // Check if already following
      const statusResponse = await followApi.getFollowStatus(targetUser.publicSlug);
      const isFollowing = statusResponse.data.isFollowing;

      if (isFollowing) {
        unfollowMutation.mutate(targetUser.publicSlug);
      } else {
        followMutation.mutate(targetUser.publicSlug);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleUserClick = (userSlug: string) => {
    router.push(`/u/${userSlug}`);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const currentList = activeTab === 'followers' ? followers : following;
  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isOwnProfile ? 'Your' : `${slug}'s`} Connections
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {[
              { id: 'followers', label: 'Followers', count: followers.length },
              { id: 'following', label: 'Following', count: following.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'followers' | 'following')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* User List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
              />
            </div>
          ) : currentList.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <AnimatePresence>
                {currentList.map((targetUser, index) => (
                  <motion.div
                    key={targetUser._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      {/* User Info */}
                      <div 
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => handleUserClick(targetUser.publicSlug)}
                      >
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          src={targetUser.avatarUrl}
                          alt={targetUser.displayName}
                          className="w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-gray-100 dark:ring-gray-800"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {targetUser.displayName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{targetUser.publicSlug}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {isOwnProfile ? (
                          // Show message button for own profile
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </motion.button>
                        ) : targetUser.publicSlug !== user?.publicSlug ? (
                          // Show follow/unfollow button for other users (not self)
                          <FollowButton
                            user={targetUser}
                            onToggle={() => handleFollowToggle(targetUser)}
                            isLoading={followMutation.isPending || unfollowMutation.isPending}
                          />
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No {activeTab} yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                {activeTab === 'followers'
                  ? isOwnProfile
                    ? "When people follow you, they'll appear here"
                    : "This user doesn't have any followers yet"
                  : isOwnProfile
                  ? "Start following people to see them here"
                  : "This user isn't following anyone yet"}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Follow Button Component
function FollowButton({ 
  user, 
  onToggle, 
  isLoading 
}: { 
  user: User; 
  onToggle: () => void; 
  isLoading: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await followApi.getFollowStatus(user.publicSlug);
        setIsFollowing(response.data.isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [user.publicSlug]);

  const handleClick = () => {
    setIsFollowing(!isFollowing);
    onToggle();
  };

  if (checkingStatus) {
    return (
      <div className="w-20 h-9 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
        isFollowing
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
      }`}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </motion.button>
  );
}