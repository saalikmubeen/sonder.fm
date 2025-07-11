'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Users,
  Clock,
  Filter,
  Radio,
  MessageSquare,
  Heart,
  UserPlus,
  Bookmark,
  Sparkles,
  Play,
  ExternalLink,
  Crown,
  Sun,
  Moon,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { activityApi } from '@/lib/api';
import { useInfiniteQuery } from '@tanstack/react-query';
import { timeAgo } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import BackButton from '@/components/BackButton';

// Activity item component
function ActivityItem({ activity, user, isOwnActivity }: { activity: any; user?: any; isOwnActivity?: boolean }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'room_join':
        return <Radio className="w-4 h-4 text-green-500" />;
      case 'room_create':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'vibe_note':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'reaction':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'bookmark':
        return <Bookmark className="w-4 h-4 text-indigo-500" />;
      case 'theme_change':
        return <Sparkles className="w-4 h-4 text-orange-500" />;
      case 'track_play':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'playlist_export':
        return <ExternalLink className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    const isSelf = isOwnActivity && user && activity.actorSlug === user.publicSlug;
    const actorDisplay = isSelf ? 'You' : (
      <Link
        href={`/u/${activity.actorSlug}`}
        className="font-semibold hover:underline"
      >
        {activity.actorName}
      </Link>
    );
    switch (activity.type) {
      case 'room_join':
        return (
          <>
            {actorDisplay} joined room{' '}
            <span className="font-medium text-green-600 dark:text-green-400">{activity.roomName}</span>
          </>
        );
      case 'room_create':
        return (
          <>
            {actorDisplay} created room{' '}
            <span className="font-medium text-yellow-600 dark:text-yellow-400">{activity.roomName}</span>
          </>
        );
      case 'vibe_note':
        return (
          <>
            {actorDisplay} left a vibe note{' '}
            {activity.targetUserName && (
              <>
                for{' '}
                <Link
                  href={`/u/${activity.targetUserSlug}`}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {activity.targetUserName}
                </Link>
              </>
            )}
          </>
        );
      case 'reaction':
        return (
          <>
            {actorDisplay} reacted {activity.metadata?.emoji}{' '}
            {activity.targetUserName && (
              <>
                to{' '}
                <Link
                  href={`/u/${activity.targetUserSlug}`}
                  className="font-medium text-pink-600 dark:text-pink-400 hover:underline"
                >
                  {activity.targetUserName}
                </Link>
              </>
            )}
          </>
        );
      case 'follow':
        return (
          <>
            {actorDisplay} followed{' '}
            <Link
              href={`/u/${activity.targetUserSlug}`}
              className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              {activity.targetUserName}
            </Link>
          </>
        );
      case 'bookmark':
        return (
          <>
            {actorDisplay} bookmarked{' '}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{activity.trackName}</span>{' '}
            by {activity.trackArtist}
          </>
        );
      case 'theme_change':
        return (
          <>
            {actorDisplay} changed theme to{' '}
            <span className="font-medium text-orange-600 dark:text-orange-400">{activity.metadata?.theme}</span>
          </>
        );
      case 'track_play':
        return (
          <>
            {actorDisplay} played{' '}
            <span className="font-medium text-green-600 dark:text-green-400">{activity.trackName}</span>{' '}
            in {activity.roomName}
          </>
        );
      case 'playlist_export':
        return (
          <>
            {actorDisplay} exported playlist from{' '}
            <span className="font-medium text-blue-600 dark:text-blue-400">{activity.roomName}</span>
          </>
        );
      default:
        return (
          <>
            {actorDisplay} did something
          </>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <Link href={`/u/${activity.actorSlug}`}>
        <motion.img
          whileHover={{ scale: 1.1 }}
          src={activity.actorAvatar}
          alt={activity.actorName}
          className="w-10 h-10 rounded-full object-cover shadow-md"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getActivityIcon(activity.type)}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {getActivityText(activity)}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          {timeAgo(new Date(activity.createdAt))}
        </div>
      </div>

      {activity.trackImage && (
        <img
          src={activity.trackImage}
          alt="Track"
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-md"
        />
      )}
    </motion.div>
  );
}

export default function ActivityFeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'me'>('feed');
  const [filterType, setFilterType] = useState<string>('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch activity feed
  const {
    data: feedData,
    fetchNextPage: fetchNextFeed,
    hasNextPage: hasNextFeed,
    isFetchingNextPage: isFetchingNextFeed,
    isLoading: feedLoading,
  } = useInfiniteQuery({
    queryKey: ['activity-feed', filterType],
    queryFn: ({ pageParam }) =>
      activityApi.getFeed(20, pageParam, filterType || undefined),
    getNextPageParam: (lastPage) =>
      lastPage.data?.nextCursor || undefined,
    enabled: !!user && activeTab === 'feed',
    initialPageParam: undefined,
  });

  // Fetch user's own activities
  const {
    data: myData,
    fetchNextPage: fetchNextMy,
    hasNextPage: hasNextMy,
    isFetchingNextPage: isFetchingNextMy,
    isLoading: myLoading,
  } = useInfiniteQuery({
    queryKey: ['my-activities', filterType],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      activityApi.getMyActivities(
        20,
        pageParam,
        filterType || undefined
      ),
    getNextPageParam: (lastPage: any) =>
      lastPage.data?.nextCursor || undefined,
    enabled: !!user && activeTab === 'me',
    initialPageParam: undefined,
  });

  const feedActivities =
    (feedData?.pages.flatMap((page) => page.data?.activities || []) || [])
      .filter((activity) => !user || activity.actorSlug !== user.publicSlug);
  const myActivities =
    myData?.pages.flatMap((page) => page.data?.activities || []) ||
    [];
  const currentActivities =
    activeTab === 'feed' ? feedActivities : myActivities;
  const isLoading = activeTab === 'feed' ? feedLoading : myLoading;
  const hasNextPage = activeTab === 'feed' ? hasNextFeed : hasNextMy;
  const isFetchingNextPage =
    activeTab === 'feed' ? isFetchingNextFeed : isFetchingNextMy;
  const fetchNextPage =
    activeTab === 'feed' ? fetchNextFeed : fetchNextMy;

  const activityTypes = [
    { value: '', label: 'All Activity', icon: Activity },
    { value: 'room_join', label: 'Room Joins', icon: Radio },
    { value: 'vibe_note', label: 'Vibe Notes', icon: MessageSquare },
    { value: 'reaction', label: 'Reactions', icon: Heart },
    { value: 'follow', label: 'Follows', icon: UserPlus },
    { value: 'bookmark', label: 'Bookmarks', icon: Bookmark },
    { value: 'track_play', label: 'Track Plays', icon: Play },
  ];

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
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
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
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Activity Feed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to see your activity feed and what your
            friends are up to.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
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
          className="text-center mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <BackButton />
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Activity Feed
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See what&apos;s happening in your musical world
                </p>
              </div>
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setTheme(theme === 'dark' ? 'light' : 'dark')
                }
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-3xl shadow p-4 sm:p-6 mb-6 backdrop-blur-sm"
        >
          {/* Tab Navigation */}
          <div className="flex bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 rounded-full p-1 mb-4 shadow-sm">
            {[
              { id: 'feed', label: 'Friends Feed', icon: Users },
              { id: 'me', label: 'My Activity', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800 my-3" />

          {/* Activity Type Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Filter by type
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border border-transparent ${
                    filterType === type.value
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/20 text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-800 shadow'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'feed'
                ? 'Friends Activity'
                : 'Your Activity'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === 'feed'
                ? 'See what your friends are listening to and doing'
                : 'Your recent activity on Sonder.fm'}
            </p>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
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
            ) : currentActivities.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentActivities.map((activity) => (
                  <ActivityItem
                    key={activity._id}
                    activity={activity}
                    user={user}
                    isOwnActivity={activeTab === 'me'}
                  />
                ))}

                {hasNextPage && (
                  <div className="p-6 text-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          Loading...
                        </div>
                      ) : (
                        'Load More'
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activity yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {activeTab === 'feed'
                    ? "Follow some friends to see their activity here, or they haven't been active recently."
                    : 'Start using Sonder.fm to see your activity here. Join rooms, bookmark songs, and connect with friends!'}
                </p>
                {activeTab === 'feed' && (
                  <Link
                    href="/jam/discover"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
                  >
                    <Radio className="w-4 h-4" />
                    Discover Rooms
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
