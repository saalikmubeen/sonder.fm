'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  Users,
  UserPlus,
  UserMinus,
  Settings,
  ExternalLink,
  Music,
  Bookmark,
  Palette,
  Sun,
  Moon,
  Share2,
  Copy,
  MoreHorizontal,
  Edit3,
  Save,
  X,
  Clock,
  Calendar,
  Headphones,
  Disc3,
  Radio,
  TrendingUp,
  Sparkles,
  Crown,
  Star,
  Zap,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  profileApi,
  reactionApi,
  noteApi,
  followApi,
  bookmarkApi,
} from '@/lib/api';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { formatTime, timeAgo } from '@sonder/utils';
import { getThemeConfig } from '@sonder/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import ThemeSelector from '@/components/ThemeSelector';

// MarqueeText component for overflowing text
function MarqueeText({
  text,
  className = '',
  speed = 25,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    function measure() {
      if (containerRef.current && textRef.current) {
        const distance =
          textRef.current.scrollWidth -
          containerRef.current.clientWidth;
        setScrollDistance(distance > 0 ? distance : 0);
        setIsOverflowing(distance > 0);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  const duration = scrollDistance / speed || 6;
  const pause = 1.2;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden whitespace-nowrap ${className}`}
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
        <span ref={textRef} className="inline-block">
          {text}
        </span>
      )}
    </div>
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
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingVibe, setEditingVibe] = useState(false);
  const [newVibeSummary, setNewVibeSummary] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch profile data
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile', slug],
    queryFn: () => profileApi.getProfile(slug),
    enabled: !!slug,
  });

  // Fetch follow status
  const { data: followStatusData } = useQuery({
    queryKey: ['follow-status', slug],
    queryFn: () => followApi.getFollowStatus(slug),
    enabled: !!user && !!slug && user.publicSlug !== slug,
  });

  // Fetch bookmarks
  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarks', slug],
    queryFn: () => bookmarkApi.getBookmarksForUser(slug, 10),
    enabled: !!slug,
  });

  const profile = profileData?.data;
  const isFollowing = followStatusData?.data?.isFollowing || false;
  const bookmarks = bookmarksData?.data?.bookmarks || [];
  const isOwnProfile = user?.publicSlug === slug;

  // Get theme configuration
  const themeConfig = profile
    ? getThemeConfig(profile.profileTheme)
    : getThemeConfig('default');
  const themeStyles = themeConfig.styles;

  // Mutations
  const followMutation = useMutation({
    mutationFn: () => followApi.follow(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['follow-status', slug],
      });
      toast.success('Following! ✨');
    },
    onError: () => toast.error('Failed to follow user'),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followApi.unfollow(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['follow-status', slug],
      });
      toast.success('Unfollowed');
    },
    onError: () => toast.error('Failed to unfollow user'),
  });

  const reactionMutation = useMutation({
    mutationFn: (emoji: string) =>
      reactionApi.addReaction(slug, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      toast.success('Reaction added! 💫');
    },
    onError: () => toast.error('Failed to add reaction'),
  });

  const noteMutation = useMutation({
    mutationFn: (data: { note: string; isAnonymous: boolean }) =>
      noteApi.addNote(slug, data.note, data.isAnonymous),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      setNewNote('');
      setShowNoteForm(false);
      toast.success('Vibe note sent! 🎵');
    },
    onError: () => toast.error('Failed to send note'),
  });

  const updateVibeMutation = useMutation({
    mutationFn: (vibeSummary: string) =>
      fetch('/api/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem(
            'sonder_token'
          )}`,
        },
        body: JSON.stringify({ vibeSummary }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      setEditingVibe(false);
      toast.success('Vibe updated! ✨');
    },
    onError: () => toast.error('Failed to update vibe'),
  });

  const handleReaction = (emoji: string) => {
    if (!user) {
      toast.error('Please log in to react');
      return;
    }
    reactionMutation.mutate(emoji);
  };

  const handleFollow = () => {
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

  const handleNoteSubmit = () => {
    if (!newNote.trim()) return;
    noteMutation.mutate({ note: newNote.trim(), isAnonymous });
  };

  const handleVibeEdit = () => {
    setNewVibeSummary(profile?.vibeSummary || '');
    setEditingVibe(true);
  };

  const handleVibeSave = () => {
    if (newVibeSummary.trim() !== profile?.vibeSummary) {
      updateVibeMutation.mutate(newVibeSummary.trim());
    } else {
      setEditingVibe(false);
    }
  };

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile URL copied! 📋');
  };

  if (loading || profileLoading) {
    return (
      <div
        className={`min-h-screen ${themeStyles.background} flex items-center justify-center`}
      >
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

  if (profileError || !profile) {
    return (
      <div
        className={`min-h-screen ${themeStyles.background} flex items-center justify-center p-4`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8 text-red-500" />
          </div>
          <h1
            className={`text-2xl font-bold ${themeStyles.text.primary} mb-4`}
          >
            Profile Not Found
          </h1>
          <p className={`${themeStyles.text.secondary} mb-6`}>
            This user doesn't exist or their profile is private.
          </p>
          <button
            onClick={() => router.push('/')}
            className={`px-6 py-3 ${themeStyles.button.primary} rounded-2xl font-medium transition-colors`}
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  const mainClassName = `min-h-screen ${themeStyles.background} ${
    themeConfig.fonts?.primary || ''
  }`;

  return (
    <div className={mainClassName}>
      {/* Background Effects */}
      {themeConfig.effects?.blur && (
        <div className="fixed inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl pointer-events-none" />
      )}
      {themeConfig.effects?.glow && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
      )}
      {themeConfig.effects?.grain && (
        <div
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${themeStyles.card} rounded-3xl p-6 mb-6 ${
            themeConfig.effects?.blur ? 'backdrop-blur-sm' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-20 h-20 rounded-full object-cover shadow-lg"
              />
              <div>
                <h1
                  className={`text-2xl font-bold ${themeStyles.text.primary} mb-1`}
                >
                  {profile.displayName}
                </h1>
                <p
                  className={`${themeStyles.text.secondary} text-sm mb-2`}
                >
                  @{profile.publicSlug}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <Link
                    href={`/u/${slug}/following?tab=followers`}
                    className={`${themeStyles.text.secondary} hover:${themeStyles.text.accent} transition-colors`}
                  >
                    <span className="font-semibold">0</span> followers
                  </Link>
                  <Link
                    href={`/u/${slug}/following?tab=following`}
                    className={`${themeStyles.text.secondary} hover:${themeStyles.text.accent} transition-colors`}
                  >
                    <span className="font-semibold">0</span> following
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mounted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
                  className={`p-2 rounded-full ${themeStyles.reactions} transition-colors`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={copyProfileUrl}
                className={`p-2 rounded-full ${themeStyles.reactions} transition-colors`}
                title="Share profile"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>

              {isOwnProfile && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowThemeSelector(true)}
                  className={`p-2 rounded-full ${themeStyles.reactions} transition-colors`}
                  title="Change theme"
                >
                  <Palette className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Vibe Summary */}
          <div className="mb-6">
            {editingVibe ? (
              <div className="space-y-3">
                <textarea
                  value={newVibeSummary}
                  onChange={(e) => setNewVibeSummary(e.target.value)}
                  placeholder="Describe your musical vibe..."
                  maxLength={300}
                  rows={3}
                  className={`w-full px-4 py-3 ${themeStyles.card} ${themeStyles.border} rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 ${themeStyles.text.primary}`}
                />
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs ${themeStyles.text.secondary}`}
                  >
                    {newVibeSummary.length}/300
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingVibe(false)}
                      className={`px-3 py-1 ${themeStyles.button.secondary} rounded-lg text-sm transition-colors`}
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVibeSave}
                      disabled={updateVibeMutation.isPending}
                      className={`px-3 py-1 ${themeStyles.button.primary} rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1`}
                    >
                      {updateVibeMutation.isPending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className="w-3 h-3 border border-current border-t-transparent rounded-full"
                        />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      Save
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <p
                  className={`${
                    themeStyles.text.primary
                  } text-lg leading-relaxed ${
                    themeConfig.fonts?.primary || ''
                  }`}
                >
                  {profile.vibeSummary}
                </p>
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={handleVibeEdit}
                    className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 rounded-full ${themeStyles.reactions} transition-all`}
                    title="Edit vibe"
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFollow}
                disabled={
                  followMutation.isPending ||
                  unfollowMutation.isPending
                }
                className={`flex-1 px-4 py-3 ${
                  isFollowing
                    ? themeStyles.button.secondary
                    : themeStyles.button.primary
                } rounded-2xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {followMutation.isPending ||
                unfollowMutation.isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNoteForm(!showNoteForm)}
                className={`px-4 py-3 ${themeStyles.button.secondary} rounded-2xl font-medium transition-all flex items-center gap-2`}
              >
                <MessageSquare className="w-4 h-4" />
                Vibe Note
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Now Playing */}
        {profile.nowPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${themeStyles.card} rounded-3xl p-6 mb-6 ${
              themeConfig.effects?.blur ? 'backdrop-blur-sm' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 ${themeStyles.nowPlaying.background} rounded-full flex items-center justify-center`}
              >
                <Music
                  className={`w-5 h-5 ${themeStyles.text.accent}`}
                />
              </div>
              <div>
                <h2
                  className={`text-lg font-bold ${themeStyles.text.primary}`}
                >
                  Now Playing
                </h2>
                <p
                  className={`text-sm ${themeStyles.text.secondary}`}
                >
                  {profile.nowPlaying.isPlaying
                    ? 'Currently listening'
                    : 'Last played'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <motion.img
                animate={
                  profile.nowPlaying.isPlaying
                    ? { rotate: [0, 5, -5, 0] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
                src={profile.nowPlaying.albumArt}
                alt={profile.nowPlaying.album}
                className="w-16 h-16 rounded-lg object-cover shadow-lg"
              />

              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold ${themeStyles.text.primary} mb-1`}
                >
                  <MarqueeText text={profile.nowPlaying.song} />
                </h3>
                <p
                  className={`text-sm ${themeStyles.text.secondary} truncate`}
                >
                  {profile.nowPlaying.artist}
                </p>
                <p
                  className={`text-xs ${themeStyles.text.secondary} truncate`}
                >
                  {profile.nowPlaying.album}
                </p>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div
                    className={`h-1 ${themeStyles.border.replace(
                      'border-',
                      'bg-'
                    )} rounded-full overflow-hidden`}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          (profile.nowPlaying.progressMs /
                            profile.nowPlaying.durationMs) *
                          100
                        }%`,
                      }}
                      className={`h-full ${themeStyles.nowPlaying.progress} rounded-full`}
                    />
                  </div>
                  <div
                    className={`flex justify-between text-xs ${themeStyles.text.secondary}`}
                  >
                    <span>
                      {formatTime(profile.nowPlaying.progressMs)}
                    </span>
                    <span>
                      {formatTime(profile.nowPlaying.durationMs)}
                    </span>
                  </div>
                </div>
              </div>

              <motion.a
                whileHover={{ scale: 1.05 }}
                href={profile.nowPlaying.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-full ${themeStyles.reactions} transition-colors`}
                title="Open in Spotify"
              >
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        )}

        {/* Vibe Note Form */}
        <AnimatePresence>
          {showNoteForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`${themeStyles.card} rounded-3xl p-6 mb-6 ${
                themeConfig.effects?.blur ? 'backdrop-blur-sm' : ''
              }`}
            >
              <h3
                className={`text-lg font-bold ${themeStyles.text.primary} mb-4`}
              >
                Send a Vibe Note
              </h3>
              <div className="space-y-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Share your thoughts about their music taste..."
                  maxLength={300}
                  rows={3}
                  className={`w-full px-4 py-3 ${themeStyles.card} ${themeStyles.border} rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 ${themeStyles.text.primary}`}
                />
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) =>
                        setIsAnonymous(e.target.checked)
                      }
                      className="rounded"
                    />
                    <span
                      className={`text-sm ${themeStyles.text.secondary}`}
                    >
                      Send anonymously
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNoteForm(false)}
                      className={`px-4 py-2 ${themeStyles.button.secondary} rounded-xl text-sm transition-colors`}
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNoteSubmit}
                      disabled={
                        !newNote.trim() || noteMutation.isPending
                      }
                      className={`px-4 py-2 ${themeStyles.button.primary} rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2`}
                    >
                      {noteMutation.isPending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className="w-3 h-3 border border-current border-t-transparent rounded-full"
                        />
                      ) : (
                        <MessageSquare className="w-3 h-3" />
                      )}
                      Send Note
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${themeStyles.card} rounded-3xl p-6 mb-6 ${
            themeConfig.effects?.blur ? 'backdrop-blur-sm' : ''
          }`}
        >
          <h3
            className={`text-lg font-bold ${themeStyles.text.primary} mb-4`}
          >
            Reactions
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {['🔥', '💜', '😭', '✨', '🎵', '💫', '🌙', '🖤'].map(
              (emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReaction(emoji)}
                  className={`px-3 py-2 ${themeStyles.reactions} rounded-full text-lg hover:shadow-lg transition-all flex items-center gap-1`}
                >
                  {emoji}
                  {profile.reactions[emoji] && (
                    <span
                      className={`text-xs ${themeStyles.text.secondary}`}
                    >
                      {profile.reactions[emoji]}
                    </span>
                  )}
                </motion.button>
              )
            )}
          </div>
        </motion.div>

        {/* Vibe Notes */}
        {profile.vibeNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${themeStyles.card} rounded-3xl p-6 mb-6 ${
              themeConfig.effects?.blur ? 'backdrop-blur-sm' : ''
            }`}
          >
            <h3
              className={`text-lg font-bold ${themeStyles.text.primary} mb-4`}
            >
              Vibe Notes
            </h3>
            <div className="space-y-3">
              {profile.vibeNotes.map((note: any) => (
                <motion.div
                  key={note._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${themeStyles.notes} rounded-2xl p-4`}
                >
                  <p className={`${themeStyles.text.primary} mb-2`}>
                    "{note.note}"
                  </p>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs ${themeStyles.text.secondary}`}
                    >
                      {note.isAnonymous
                        ? 'Anonymous'
                        : note.authorId?.displayName}
                    </span>
                    <span
                      className={`text-xs ${themeStyles.text.secondary}`}
                    >
                      {timeAgo(new Date(note.createdAt))}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`${themeStyles.card} rounded-3xl p-6 ${
              themeConfig.effects?.blur ? 'backdrop-blur-sm' : ''
            }`}
          >
            <h3
              className={`text-lg font-bold ${themeStyles.text.primary} mb-4`}
            >
              Recent Bookmarks
            </h3>
            <div className="space-y-3">
              {bookmarks.slice(0, 5).map((bookmark: any) => (
                <motion.div
                  key={bookmark._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 p-3 ${themeStyles.reactions} rounded-2xl transition-colors`}
                >
                  <img
                    src={bookmark.metadata.album.imageUrl}
                    alt={bookmark.metadata.album.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium ${themeStyles.text.primary} truncate`}
                    >
                      {bookmark.metadata.name}
                    </h4>
                    <p
                      className={`text-sm ${themeStyles.text.secondary} truncate`}
                    >
                      {bookmark.metadata.artists
                        .map((a: any) => a.name)
                        .join(', ')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span
                        className={`text-xs ${themeStyles.text.secondary}`}
                      >
                        {formatTime(bookmark.timestampMs)}
                      </span>
                    </div>
                  </div>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    href={bookmark.metadata.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full ${themeStyles.reactions} transition-colors`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelector
        currentTheme={profile.profileTheme}
        userSlug={slug}
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </div>
  );
}
