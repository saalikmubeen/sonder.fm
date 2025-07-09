'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Heart,
  MessageSquare,
  UserPlus,
  UserMinus,
  Bookmark,
  ExternalLink,
  Play,
  Pause,
  MoreHorizontal,
  Users,
  Activity,
  Clock,
  Hash,
  Sparkles,
  Crown,
  Radio,
  Calendar,
  MapPin,
  Headphones,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { profileApi, reactionApi, noteApi, followApi, activityApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { formatTime, timeAgo } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTheme } from 'next-themes';

// MarqueeText component for overflowing text
function MarqueeText({ text, className = "", speed = 25 }: { text: string; className?: string; speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    function measure() {
      if (containerRef.current && textRef.current) {
        const distance = textRef.current.scrollWidth - containerRef.current.clientWidth;
        setScrollDistance(distance > 0 ? distance : 0);
        setIsOverflowing(distance > 0);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  const duration = (scrollDistance / speed) || 6;
  const pause = 1.2;

  return (
    <div
      ref={containerRef}
      className={`relative w-[70vw] max-w-full sm:w-auto overflow-hidden whitespace-nowrap ${className}`}
      style={{ maxWidth: '100%' }}
    >
      {isOverflowing && scrollDistance > 0 ? (
        <>
          <motion.div
            ref={textRef}
            initial={{ x: 0 }}
            animate={{ x: [-0, -scrollDistance, -scrollDistance] }}
            transition={{
              times: [0, 0.95, 1],
              duration: duration + pause,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'loop',
              repeatDelay: 0,
            }}
            className="inline-block"
          >
            {text}
          </motion.div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />
        </>
      ) : (
        <span ref={textRef} className="inline-block">{text}</span>
      )}
    </div>
  );
}

// Activity item component
function ActivityItem({ activity }: { activity: any }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'room_join': return <Radio className="w-4 h-4 text-green-500" />;
      case 'room_create': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'vibe_note': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'reaction': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'bookmark': return <Bookmark className="w-4 h-4 text-indigo-500" />;
      case 'theme_change': return <Sparkles className="w-4 h-4 text-orange-500" />;
      case 'track_play': return <Play className="w-4 h-4 text-green-600" />;
      case 'playlist_export': return <ExternalLink className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'room_join':
        return (
          <>
            joined room <span className="font-medium text-green-600 dark:text-green-400">{activity.roomName}</span>
          </>
        );
      case 'room_create':
        return (
          <>
            created room <span className="font-medium text-yellow-600 dark:text-yellow-400">{activity.roomName}</span>
          </>
        );
      case 'vibe_note':
        return (
          <>
            left a vibe note {activity.targetUserName && (
              <>for <Link href={`/u/${activity.targetUserSlug}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{activity.targetUserName}</Link></>
            )}
          </>
        );
      case 'reaction':
        return (
          <>
            reacted {activity.metadata?.emoji} {activity.targetUserName && (
              <>to <Link href={`/u/${activity.targetUserSlug}`} className="font-medium text-pink-600 dark:text-pink-400 hover:underline">{activity.targetUserName}</Link></>
            )}
          </>
        );
      case 'follow':
        return (
          <>
            followed <Link href={`/u/${activity.targetUserSlug}`} className="font-medium text-purple-600 dark:text-purple-400 hover:underline">{activity.targetUserName}</Link>
          </>
        );
      case 'bookmark':
        return (
          <>
            bookmarked <span className="font-medium text-indigo-600 dark:text-indigo-400">{activity.trackName}</span> by {activity.trackArtist}
          </>
        );
      case 'theme_change':
        return (
          <>
            changed theme to <span className="font-medium text-orange-600 dark:text-orange-400">{activity.metadata?.theme}</span>
          </>
        );
      case 'track_play':
        return (
          <>
            played <span className="font-medium text-green-600 dark:text-green-400">{activity.trackName}</span> in {activity.roomName}
          </>
        );
      case 'playlist_export':
        return (
          <>
            exported playlist from <span className="font-medium text-blue-600 dark:text-blue-400">{activity.roomName}</span>
          </>
        );
      default:
        return 'did something';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex-shrink-0 mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/u/${activity.actorSlug}`}>
            <img
              src={activity.actorAvatar}
              alt={activity.actorName}
              className="w-5 h-5 rounded-full object-cover"
            />
          </Link>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <Link href={`/u/${activity.actorSlug}`} className="font-medium hover:underline">
              {activity.actorName}
            </Link>{' '}
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
          className="w-8 h-8 rounded object-cover flex-shrink-0"
        />
      )}
    </motion.div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'activity'>('overview');
  const [newNote, setNewNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedEmoji, setSelectedEmoji] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', slug],
    queryFn: () => profileApi.getProfile(slug),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch follow status
  const { data: followData } = useQuery({
    queryKey: ['follow-status', slug],
    queryFn: () => followApi.getFollowStatus(slug),
    enabled: !!user && user.publicSlug !== slug,
  });

  // Fetch follow counts
  const { data: followCounts } = useQuery({
    queryKey: ['follow-counts', slug],
    queryFn: () => followApi.getFollowCounts(slug),
  });

  // Fetch activity feed for this user
  const {
    data: activityData,
    fetchNextPage: fetchNextActivity,
    hasNextPage: hasNextActivity,
    isFetchingNextPage: isFetchingNextActivity,
  } = useInfiniteQuery({
    queryKey: ['user-activity', slug],
    queryFn: ({ pageParam }) => activityApi.getMyActivities(20, pageParam),
    getNextPageParam: (lastPage) => lastPage.data?.nextCursor || undefined,
    enabled: activeTab === 'activity',
  });

  const profile = profileData?.data;
  const isFollowing = followData?.data?.isFollowing || false;
  const isOwnProfile = user?.publicSlug === slug;
  const followerCount = followCounts?.data?.followerCount || 0;
  const followingCount = followCounts?.data?.followingCount || 0;

  // Mutations
  const followMutation = useMutation({
    mutationFn: () => followApi.follow(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', slug] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', slug] });
      toast.success('Following user ✨');
    },
    onError: () => toast.error('Failed to follow user'),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followApi.unfollow(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', slug] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', slug] });
      toast.success('Unfollowed user');
    },
    onError: () => toast.error('Failed to unfollow user'),
  });

  const reactionMutation = useMutation({
    mutationFn: (emoji: string) => reactionApi.addReaction(slug, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      toast.success('Reaction added! ✨');
    },
    onError: () => toast.error('Failed to add reaction'),
  });

  const noteMutation = useMutation({
    mutationFn: () => noteApi.addNote(slug, newNote, isAnonymous),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      setNewNote('');
      toast.success('Vibe note sent! 💫');
    },
    onError: () => toast.error('Failed to send vibe note'),
  });

  const handleFollowToggle = () => {
    if (!user) {
      toast.error('Please log in to follow users');
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleReaction = (emoji: string) => {
    if (!user) {
      toast.error('Please log in to react');
      return;
    }
    reactionMutation.mutate(emoji);
  };

  const handleSendNote = () => {
    if (!newNote.trim()) return;
    noteMutation.mutate();
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (profileError || !profile) {
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
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This profile doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-medium hover:bg-purple-700 transition-colors"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  const activities = activityData?.pages.flatMap(page => page.data?.activities || []) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full object-cover shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.displayName}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  @{profile.publicSlug}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <Link
                    href={`/u/${slug}/following?tab=followers`}
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{followerCount}</span> followers
                  </Link>
                  <Link
                    href={`/u/${slug}/following?tab=following`}
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{followingCount}</span> following
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {mounted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </motion.button>
              )}

              {!isOwnProfile && user && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`px-6 py-3 rounded-2xl font-medium transition-all flex items-center gap-2 ${
                    isFollowing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
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
              )}
            </div>
          </div>

          {/* Vibe Summary */}
          <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
            {profile.vibeSummary}
          </p>

          {/* Now Playing */}
          {profile.nowPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center gap-4">
                <motion.img
                  animate={profile.nowPlaying.isPlaying ? { rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  src={profile.nowPlaying.albumArt}
                  alt={profile.nowPlaying.album}
                  className="w-16 h-16 rounded-lg object-cover shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {profile.nowPlaying.isPlaying ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Now Playing
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Pause className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-500">
                          Paused
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 overflow-hidden">
                    <MarqueeText text={profile.nowPlaying.song} />
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {profile.nowPlaying.artist}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-1000"
                        style={{
                          width: `${(profile.nowPlaying.progressMs / profile.nowPlaying.durationMs) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(profile.nowPlaying.progressMs)} / {formatTime(profile.nowPlaying.durationMs)}
                    </span>
                  </div>
                </div>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href={profile.nowPlaying.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.a>
              </div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Music },
              { id: 'notes', label: 'Vibe Notes', icon: MessageSquare },
              { id: 'activity', label: 'Activity', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Reactions */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Reactions
                </h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(profile.reactions || {}).map(([emoji, count]) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReaction(emoji)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-lg">{emoji}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {count}
                      </span>
                    </motion.button>
                  ))}
                </div>
                {user && !isOwnProfile && (
                  <div className="flex gap-2">
                    {['❤️', '🔥', '😭', '🎵', '✨', '💫'].map((emoji) => (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReaction(emoji)}
                        className="text-2xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Spotify Profile Stats */}
              {profile.spotifyProfile && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Music Profile
                  </h2>
                  
                  {/* Top Artists */}
                  {profile.spotifyProfile.topArtists?.short?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        Top Artists
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {profile.spotifyProfile.topArtists.short.slice(0, 6).map((artist: any) => (
                          <motion.a
                            key={artist.id}
                            href={artist.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <img
                              src={artist.imageUrl}
                              alt={artist.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {artist.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {artist.popularity}% popularity
                              </p>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Tracks */}
                  {profile.spotifyProfile.topTracks?.short?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        Top Tracks
                      </h3>
                      <div className="space-y-3">
                        {profile.spotifyProfile.topTracks.short.slice(0, 5).map((track: any) => (
                          <motion.a
                            key={track.id}
                            href={track.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <img
                              src={track.album.imageUrl}
                              alt={track.album.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {track.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {track.artists.map((a: any) => a.name).join(', ')}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Vibe Notes
              </h2>

              {/* Add Note Form */}
              {user && !isOwnProfile && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Leave a vibe note..."
                    maxLength={300}
                    rows={3}
                    className="w-full px-0 py-2 bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded"
                      />
                      Anonymous
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {newNote.length}/300
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendNote}
                        disabled={!newNote.trim() || noteMutation.isPending}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {noteMutation.isPending ? 'Sending...' : 'Send'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div className="space-y-4">
                {profile.vibeNotes?.length > 0 ? (
                  profile.vibeNotes.map((note: any) => (
                    <motion.div
                      key={note._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                    >
                      <p className="text-gray-800 dark:text-gray-200 mb-3 italic">
                        "{note.note}"
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          {note.authorId && !note.isAnonymous ? (
                            <>
                              <img
                                src={note.authorId.avatarUrl}
                                alt={note.authorId.displayName}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span>by {note.authorId.displayName}</span>
                            </>
                          ) : (
                            <span>anonymous</span>
                          )}
                        </div>
                        <span>{timeAgo(new Date(note.createdAt))}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No vibe notes yet</p>
                    {!isOwnProfile && <p className="text-sm">Be the first to leave one!</p>}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Activity
              </h2>

              <div className="space-y-2">
                {activities.length > 0 ? (
                  <>
                    {activities.map((activity) => (
                      <ActivityItem key={activity._id} activity={activity} />
                    ))}
                    
                    {hasNextActivity && (
                      <div className="text-center pt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => fetchNextActivity()}
                          disabled={isFetchingNextActivity}
                          className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          {isFetchingNextActivity ? (
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Activity will appear here as {isOwnProfile ? 'you' : 'they'} use the app</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}