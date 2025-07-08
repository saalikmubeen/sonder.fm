'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Users,
  Music,
  ExternalLink,
  Calendar,
  Clock,
  Bookmark,
  UserPlus,
  UserMinus,
  Settings,
  Palette,
  Volume2,
  Pause,
  Play,
  MoreHorizontal,
  Send,
  Trash2,
  User,
  MessageSquare,
  Sparkles,
  Quote,
  Plus,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { profileApi, followApi, reactionApi, noteApi, userApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getThemeClasses, timeAgo, formatTime } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import BookmarkModal from '@/components/BookmarkModal';
import { bookmarkApi } from '@/lib/api';

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
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-current to-transparent opacity-20" />
        </>
      ) : (
        <span ref={textRef} className="inline-block">{text}</span>
      )}
    </div>
  );
}

// Vibe Note Component
function VibeNote({ note, isOwner, onDelete }: { 
  note: any; 
  isOwner: boolean; 
  onDelete: (noteId: string) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300"
    >
      {/* Quote decoration */}
      <div className="absolute top-2 left-2 opacity-20">
        <Quote className="w-4 h-4 text-purple-500" />
      </div>

      <div className="pl-6">
        {/* Note content */}
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-3 font-medium">
          {note.note}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {note.isAnonymous ? (
              <div className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                <span>anonymous</span>
              </div>
            ) : note.authorId ? (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>by {note.authorId.displayName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                <span>anonymous</span>
              </div>
            )}
            <span>•</span>
            <span>{timeAgo(new Date(note.createdAt))}</span>
          </div>

          {/* Delete button for profile owner */}
          {isOwner && (
            <div className="relative">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all duration-200"
                  title="Delete note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onDelete(note._id);
                      setShowDeleteConfirm(false);
                    }}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Vibe Notes Form Component
function VibeNotesForm({ profileSlug, onNoteAdded }: { 
  profileSlug: string; 
  onNoteAdded: () => void;
}) {
  const [note, setNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await noteApi.addNote(profileSlug, note.trim(), isAnonymous);
      setNote('');
      onNoteAdded();
      toast.success('Vibe note added! ✨');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Leave a vibe note
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share your thoughts about their musical taste
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="This music makes me think of starlit drives through empty cities..."
            maxLength={300}
            rows={4}
            className="w-full px-4 py-3 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {note.length}/300
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Leave anonymously
            </span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!note.trim() || isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'bookmarks' | 'vibes'>('overview');
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', slug],
    queryFn: () => profileApi.getProfile(slug),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch follow status
  const { data: followStatusData, refetch: refetchFollowStatus } = useQuery({
    queryKey: ['followStatus', slug],
    queryFn: () => followApi.getFollowStatus(slug),
    enabled: !!user && user.publicSlug !== slug,
  });

  // Fetch follow counts
  const { data: followCountsData } = useQuery({
    queryKey: ['followCounts', slug],
    queryFn: () => followApi.getFollowCounts(slug),
  });

  // Fetch bookmarks
  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['bookmarks', slug],
    queryFn: () => bookmarkApi.getBookmarksForUser(slug),
    enabled: activeTab === 'bookmarks',
  });

  // Fetch vibe notes
  const { data: vibeNotesData, isLoading: vibeNotesLoading, refetch: refetchVibeNotes } = useQuery({
    queryKey: ['vibeNotes', slug],
    queryFn: () => noteApi.getNotes(slug),
    enabled: activeTab === 'vibes',
  });

  const profile = profileData?.data;
  const isFollowing = followStatusData?.data?.isFollowing || false;
  const followCounts = followCountsData?.data || { followerCount: 0, followingCount: 0 };
  const bookmarks = bookmarksData?.data?.bookmarks || [];
  const vibeNotes = vibeNotesData?.data?.notes || [];

  const isOwnProfile = user?.publicSlug === slug;

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: () => followApi.follow(slug),
    onSuccess: () => {
      refetchFollowStatus();
      queryClient.invalidateQueries({ queryKey: ['followCounts', slug] });
      toast.success('Following! ✨');
    },
    onError: () => toast.error('Failed to follow user'),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followApi.unfollow(slug),
    onSuccess: () => {
      refetchFollowStatus();
      queryClient.invalidateQueries({ queryKey: ['followCounts', slug] });
      toast.success('Unfollowed');
    },
    onError: () => toast.error('Failed to unfollow user'),
  });

  // Reaction mutation
  const reactionMutation = useMutation({
    mutationFn: (emoji: string) => reactionApi.addReaction(slug, emoji),
    onSuccess: () => {
      refetchProfile();
      toast.success('Reaction added! 🎵');
    },
    onError: () => toast.error('Failed to add reaction'),
  });

  // Delete vibe note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => noteApi.deleteNote(noteId),
    onSuccess: () => {
      refetchVibeNotes();
      toast.success('Note deleted');
    },
    onError: () => toast.error('Failed to delete note'),
  });

  // Bookmark mutation
  const createBookmarkMutation = useMutation({
    mutationFn: (data: {
      trackId: string;
      timestampMs: number;
      durationMs: number;
      caption?: string;
      metadata: any;
    }) => bookmarkApi.createBookmark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', slug] });
      toast.success('Bookmark saved! 🎵');
      setShowBookmarkModal(false);
      setBookmarkLoading(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save bookmark');
      setBookmarkLoading(false);
    },
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

  const handleBookmarkMoment = (caption: string) => {
    if (!profile?.nowPlaying) return;
    setBookmarkLoading(true);
    const bookmarkData = {
      trackId: profile.nowPlaying.spotifyUrl?.split('/track/')[1]?.split('?')[0] || '',
      timestampMs: profile.nowPlaying.progressMs,
      durationMs: profile.nowPlaying.durationMs,
      caption: caption.trim() || undefined,
      metadata: {
        name: profile.nowPlaying.song,
        artists: [{ name: profile.nowPlaying.artist }],
        album: {
          name: profile.nowPlaying.album,
          imageUrl: profile.nowPlaying.albumArt,
        },
        spotifyUrl: profile.nowPlaying.spotifyUrl,
      },
    };
    createBookmarkMutation.mutate(bookmarkData);
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNoteMutation.mutate(noteId);
  };

  const handleVibeNoteAdded = () => {
    refetchVibeNotes();
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
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This user doesn't exist or their profile is private.
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

  const themeClasses = getThemeClasses(profile.profileTheme);

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClasses.bg}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 mb-8 border border-gray-200/50 dark:border-gray-800/50"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-700"
            />

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.displayName}
                </h1>
                
                {!isOwnProfile && user && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
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

              {/* Follow Stats */}
              <div className="flex items-center gap-6 mb-4">
                <Link
                  href={`/u/${slug}/following?tab=followers`}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{followCounts.followerCount}</span>
                  <span className="text-sm">followers</span>
                </Link>
                <Link
                  href={`/u/${slug}/following?tab=following`}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <span className="font-medium">{followCounts.followingCount}</span>
                  <span className="text-sm">following</span>
                </Link>
              </div>

              {/* Vibe Summary */}
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                {profile.vibeSummary}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 mb-8 border border-gray-200/50 dark:border-gray-800/50"
        >
          <div className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: Music },
              { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
              { id: 'vibes', label: 'Vibe Notes', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
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
              className="space-y-8"
            >
              {/* Now Playing */}
              {profile.nowPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-800/50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Volume2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Now Playing
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {profile.nowPlaying.isPlaying ? 'Currently listening' : 'Last played'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <motion.img
                        animate={profile.nowPlaying.isPlaying ? { rotate: [0, 5, -5, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        src={profile.nowPlaying.albumArt}
                        alt={profile.nowPlaying.album}
                        className="w-20 h-20 rounded-xl object-cover shadow-lg"
                      />
                      {profile.nowPlaying.isPlaying && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 overflow-hidden">
                        <MarqueeText text={profile.nowPlaying.song} />
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 truncate mb-2">
                        {profile.nowPlaying.artist}
                      </p>
                      <div className="flex items-center gap-4">
                        <a
                          href={profile.nowPlaying.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in Spotify
                        </a>
                        {isOwnProfile && (
                          <button
                            onClick={() => setShowBookmarkModal(true)}
                            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                          >
                            <Bookmark className="w-4 h-4" />
                            Bookmark
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Reactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-800/50"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Reactions
                </h2>

                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(profile.reactions || {}).map(([emoji, count]) => (
                    <motion.div
                      key={emoji}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full"
                    >
                      <span className="text-lg">{emoji}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {count}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {user && !isOwnProfile && (
                  <div className="flex gap-2">
                    {['🔥', '💜', '😭', '✨', '🎵'].map((emoji) => (
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
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'bookmarks' && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-800/50"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-purple-500" />
                Bookmarked Moments
              </h2>

              {bookmarksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {bookmarks.map((bookmark: any) => (
                    <motion.div
                      key={bookmark._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                    >
                      <img
                        src={bookmark.metadata.album.imageUrl}
                        alt={bookmark.metadata.album.name}
                        className="w-16 h-16 rounded-lg object-cover shadow-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {bookmark.metadata.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bookmark.metadata.artists[0]?.name}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            {formatTime(bookmark.timestampMs)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {timeAgo(new Date(bookmark.createdAt))}
                          </span>
                        </div>
                        {bookmark.caption && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
                            "{bookmark.caption}"
                          </p>
                        )}
                      </div>
                      <a
                        href={bookmark.metadata.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No bookmarked moments yet
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'vibes' && (
            <motion.div
              key="vibes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Vibe Notes Form */}
              {user && !isOwnProfile && (
                <VibeNotesForm 
                  profileSlug={slug} 
                  onNoteAdded={handleVibeNoteAdded}
                />
              )}

              {!user && !isOwnProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 text-center"
                >
                  <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Want to leave a vibe note?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Log in to share your thoughts about their musical taste
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Log in with Spotify
                  </button>
                </motion.div>
              )}

              {/* Vibe Notes List */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Vibe Notes
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      What others think about {isOwnProfile ? 'your' : 'their'} musical taste
                    </p>
                  </div>
                </div>

                {vibeNotesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                    />
                  </div>
                ) : vibeNotes.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {vibeNotes.map((note: any) => (
                        <VibeNote
                          key={note._id}
                          note={note}
                          isOwner={isOwnProfile}
                          onDelete={handleDeleteNote}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      No vibe notes yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {isOwnProfile 
                        ? "No one has left you a vibe note yet. Share your profile to get some!"
                        : "Be the first to leave a vibe note about their musical taste!"
                      }
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookmark Modal */}
        {profile?.nowPlaying && (
          <BookmarkModal
            isOpen={showBookmarkModal}
            onClose={() => setShowBookmarkModal(false)}
            onSave={handleBookmarkMoment}
            loading={bookmarkLoading}
            trackInfo={{
              name: profile.nowPlaying.song,
              artist: profile.nowPlaying.artist,
              album: profile.nowPlaying.album,
              albumArt: profile.nowPlaying.albumArt,
              timestampMs: profile.nowPlaying.progressMs,
            }}
          />
        )}
      </div>
    </div>
  );
}