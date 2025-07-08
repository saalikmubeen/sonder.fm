'use client';

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  User,
  Music,
  Clock,
  Users,
  List,
  ChevronRight,
  Play,
  Pause,
  ExternalLink,
  Calendar,
  Sun,
  Moon,
  ArrowRight,
  PlayCircle,
  Music as Music2,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Edit3,
  Info,
  Check,
  X,
  UserMinus,
  UserPlus,
  MessageSquare,
  Eye,
  EyeOff,
  Quote,
  Send,
   MessageCircle,
   Sparkles,
   Heart,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { formatDuration, timeAgo } from '@sonder/utils';
import { profileApi, bookmarkApi, followApi, noteApi, reactionApi } from '@/lib/api';
import BookmarkModal from '@/components/BookmarkModal';
import toast from 'react-hot-toast';
import { Card } from '@sonder/ui/components/Card';
import { Button } from '@sonder/ui/components/Button';
import { LoadingSpinner } from '@sonder/ui/components/LoadingSpinner';
import { motion as motionDiv } from 'framer-motion';
import Link from 'next/link';
import { profile } from 'console';

// Minimal Tooltip component
function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
    >
      {children}
      {show && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap">
          {content}
        </span>
      )}
    </span>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface UserProfile {
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
  profileTheme: string;
  vibeSummary: string;
  spotifyProfile: {
    followers: number;
    following: number;
    playlists: {
      total: number;
      items: any[];
    };
    topArtists: {
      short: any[];
      medium: any[];
      long: any[];
    };
    topTracks: {
      short: any[];
      medium: any[];
      long: any[];
    };
    recentlyPlayedTracks: {
      items: any[];
    };
  };
}

type TimeRange = 'short' | 'medium' | 'long';
type Section =
  | 'profile'
  | 'artists'
  | 'tracks'
  | 'recent'
  | 'playlists'
  | 'bookmarks'
  | 'vibe_notes';

// MarqueeText: Robust marquee effect for overflowing text
function MarqueeText({ text, className = "", speed = 50 }: { text: string; className?: string; speed?: number }) {
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

  // Animation: left to right, then jump back, with pause at end
  const duration = (scrollDistance / speed) || 6;
  const pause = 1.2; // seconds to pause at the end

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
          {/* Right fade gradient */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-black/80 dark:from-black/80 to-transparent" />
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="group flex flex-col bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors shadow-sm"
    >
      <div className="flex items-center gap-2 mb-1">
        <Quote className="w-4 h-4 text-purple-400 opacity-60" />
        <span className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{note.note}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {note.isAnonymous ? (
            <><EyeOff className="w-3 h-3" /><span>anonymous</span></>
          ) : note.authorId ? (
            <><Eye className="w-3 h-3" /><span>by {note.authorId.displayName}</span></>
          ) : (
            <><EyeOff className="w-3 h-3" /><span>anonymous</span></>
          )}
          <span>•</span>
          <span>{timeAgo(new Date(note.createdAt))}</span>
        </div>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 space-y-3 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-5 h-5 text-purple-400" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">Leave a vibe note</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Share your thoughts about their musical taste</p>
        </div>
      </div>
      <div className="relative">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="This music makes me think of starlit drives through empty cities..."
          maxLength={300}
          rows={3}
          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white text-sm"
        />
        <div className="absolute bottom-2 right-3 text-xs text-gray-400">
          {note.length}/300
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
          <span className="relative flex items-center">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="peer appearance-none w-5 h-5 rounded-full border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-900 transition-all duration-200 shadow-sm checked:bg-gradient-to-br checked:from-purple-400 checked:to-pink-400 checked:border-purple-400 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 focus:outline-none hover:shadow-md"
            />
            <span className="pointer-events-none absolute left-0 top-0 w-5 h-5 flex items-center justify-center">
              {isAnonymous && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor" /></svg>
              )}
            </span>
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300">Leave anonymously</span>
        </label>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!note.trim() || isSubmitting}
          className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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
    </motion.form>
  );
}






export default function UserProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] =
    useState<Section>('profile');
  const [timeRange, setTimeRange] = useState<TimeRange>('long');
  const [mounted, setMounted] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const queryClient = useQueryClient();

  const isOwnProfile = user?.publicSlug === slug;

  useEffect(() => {
    setMounted(true);
  }, []);

  // React Query for profile data
  const {
    data: profileData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['profile', slug],
    queryFn: () => profileApi.getProfile(slug),
    enabled: !!slug,
  });

  // React Query for bookmarks
  const {
    data: bookmarksData,
    isLoading: bookmarksLoading,
    refetch: refetchBookmarks,
  } = useQuery({
    queryKey: ['bookmarks', slug],
    queryFn: () => bookmarkApi.getBookmarksForUser(slug),
    enabled: !!slug && activeSection === 'bookmarks',
  });

  // React Query for follow counts
  const {
    data: followCountsData,
  } = useQuery({
    queryKey: ['followCounts', slug],
    queryFn: () => followApi.getFollowCounts(slug),
    enabled: !!slug,
  });

  // Create bookmark mutation
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

  // Update bookmark mutation
  const updateBookmarkMutation = useMutation({
    mutationFn: ({ bookmarkId, caption }: { bookmarkId: string; caption: string }) =>
      bookmarkApi.updateBookmark(bookmarkId, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', slug] });
      toast.success('Bookmark updated! ✨');
      setEditingBookmarkId(null);
      setEditCaption('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update bookmark');
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: string) => bookmarkApi.deleteBookmark(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', slug] });
      toast.success('Bookmark deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete bookmark');
    },
  });

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: () => followApi.follow(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      queryClient.invalidateQueries({ queryKey: ['followCounts', slug] });
      toast.success('Following user ✨');
    },
    onError: () => toast.error('Failed to follow user'),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followApi.unfollow(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', slug] });
      queryClient.invalidateQueries({ queryKey: ['followCounts', slug] });
      toast.success('Unfollowed user');
    },
    onError: () => toast.error('Failed to unfollow user'),
  });



   // Fetch vibe notes
  const { data: vibeNotesData, isLoading: vibeNotesLoading, refetch: refetchVibeNotes } = useQuery({
    queryKey: ['vibeNotes', slug],
    queryFn: () => noteApi.getNotes(slug),
    enabled: !!slug && activeSection === 'vibe_notes',
  });
  const vibeNotes = vibeNotesData?.data?.notes || [];




  // Delete vibe note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => noteApi.deleteNote(noteId),
    onSuccess: () => {
      refetchVibeNotes();
      toast.success('Note deleted');
    },
    onError: () => toast.error('Failed to delete note'),
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



  const handleReaction = (emoji: string) => {
    if (!user) {
      toast.error('Please log in to react');
      return;
    }
    reactionMutation.mutate(emoji);
  };


   const handleDeleteNote = (noteId: string) => {
    deleteNoteMutation.mutate(noteId);
  };

  const handleVibeNoteAdded = () => {
    refetchVibeNotes();
  };

  const profile = profileData?.data;
  const bookmarks = bookmarksData?.data?.bookmarks || [];
  const followCounts = followCountsData?.data || { followerCount: 0, followingCount: 0 };

  const openSpotifyUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const openSpotifyAtTimestamp = (spotifyUrl: string, timestampMs: number) => {
    const timestampSeconds = Math.floor(timestampMs / 1000);
    window.open(`${spotifyUrl}#${timestampSeconds}`, '_blank');
  };

  const handleFollowToggle = () => {
    if (!user) {
      toast.error('Please log in to follow users');
      return;
    }

    if (profile?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleFollowCountClick = (type: 'followers' | 'following') => {
    if (!user) {
      toast.error('Please log in to view followers');
      return;
    }
    router.push(`/u/${slug}/following?tab=${type}`);
  };

  // Handlers now use mutations
  const handleBookmarkMoment = (caption: string) => {
    if (!profile?.nowPlaying) return;
    setBookmarkLoading(true);
    const bookmarkData = {
      trackId: profile.nowPlaying.spotifyUrl.split('/track/')[1]?.split('?')[0] || '',
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

  const handleDeleteBookmark = (bookmarkId: string) => {
    deleteBookmarkMutation.mutate(bookmarkId);
  };

  const handleEditBookmark = (bookmarkId: string, caption: string) => {
    updateBookmarkMutation.mutate({ bookmarkId, caption });
  };

  // Add this function to refetch profile after reaction
  const refetchProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['profile', slug] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
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

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-gray-900 dark:text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Profile not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This user doesn't exist or their profile is private.
          </p>
        </div>
      </div>
    );
  }

  const timeRangeLabels = {
    long: 'All Time',
    medium: 'Last 6 Months',
    short: 'Last 4 Weeks',
  };

  const currentArtists =
    profile.spotifyProfile?.topArtists?.[timeRange] || [];
  const currentTracks =
    profile.spotifyProfile?.topTracks?.[timeRange] || [];
  const recentTracks =
    profile.spotifyProfile?.recentlyPlayedTracks?.items || [];
  const shortTracks = profile.spotifyProfile?.topTracks?.short || [];
  const longTracks = profile.spotifyProfile?.topTracks?.long || [];
  const longArtists = profile.spotifyProfile?.topArtists?.long || [];

  const sidebarItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'artists', icon: Users, label: 'Top Artists' },
    { id: 'tracks', icon: Music, label: 'Top Tracks' },
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'playlists', icon: List, label: 'Playlists' },
    { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { id: 'vibe_notes', label: 'Vibe Notes', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Side Navigation */}
        <div className="w-28 bg-white dark:bg-black fixed left-0 top-0 h-full flex flex-col">
          {/* Sonder.fm logo at the top */}
          <div className="flex items-center gap-2 h-16 px-4 select-none">
            <Link href="/" className="font-bold text-lg text-black dark:text-white hover:text-green-500 transition-colors">
              Sonder.fm
            </Link>
          </div>

          {/* Centered Navigation */}
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            <nav className="flex flex-col items-center gap-y-6 w-full">
              {sidebarItems.map(({ id, icon: Icon, label }) => (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveSection(id as Section)}
                  className={`w-full flex flex-col items-center py-2 transition-all group text-black dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none ${
                    activeSection === id
                      ? 'border-l-4 border-green-500 bg-gray-200 dark:bg-[#181818] text-black dark:text-white'
                      : 'border-l-4 border-transparent'
                  }`}
                  style={{ minWidth: '100%' }}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-sm font-normal">{label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Footer at the bottom (GitHub icon) */}
          <div className="mb-6 flex items-center justify-center w-full">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 text-black dark:text-white"
              >
                <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-28 flex-1">
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 z-40">
            <div className="px-8 py-4 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </motion.button>

              {mounted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && (
                <ProfileSection
                  profile={profile}
                  recentTracks={recentTracks}
                  shortTracks={shortTracks}
                  longTracks={longTracks}
                  longArtists={longArtists}
                  setActiveSection={setActiveSection}
                  openSpotifyUrl={openSpotifyUrl}
                  isOwnProfile={isOwnProfile}
                  onBookmarkMoment={() => setShowBookmarkModal(true)}
                  user={user}
                  followCounts={followCounts}
                  handleFollowToggle={handleFollowToggle}
                  handleFollowCountClick={handleFollowCountClick}
                  followMutation={followMutation}
                  unfollowMutation={unfollowMutation}
                  handleReaction={handleReaction}
                />
              )}
              {activeSection === 'artists' && (
                <ArtistsSection
                  artists={currentArtists}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                  timeRangeLabels={timeRangeLabels}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'tracks' && (
                <TracksSection
                  tracks={currentTracks}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                  timeRangeLabels={timeRangeLabels}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'recent' && (
                <RecentSection
                  recentTracks={recentTracks}
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'playlists' && (
                <PlaylistsSection
                  playlists={
                    profile.spotifyProfile?.playlists?.items || []
                  }
                  openSpotifyUrl={openSpotifyUrl}
                />
              )}
              {activeSection === 'bookmarks' && (
                <BookmarksSection
                  bookmarks={bookmarks}
                  loading={bookmarksLoading}
                  isOwnProfile={isOwnProfile}
                  onPlayAtTimestamp={openSpotifyAtTimestamp}
                  onDeleteBookmark={handleDeleteBookmark}
                  onEditBookmark={handleEditBookmark}
                  editingBookmarkId={editingBookmarkId}
                  editCaption={editCaption}
                  setEditingBookmarkId={setEditingBookmarkId}
                  setEditCaption={setEditCaption}
                  onEditSave={(id: string) => handleEditBookmark(id, editCaption)}
                  onEditCancel={() => setEditingBookmarkId(null)}
                  profile={profile}
                  openSpotifyAtTimestamp={openSpotifyAtTimestamp}
                />
              )}
              {activeSection === 'vibe_notes' && (
                <motion.div
                  key="vibes-desktop"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Vibe Notes Form (for others) */}
                  {user && !isOwnProfile && (
                    <div className="max-w-2xl mx-auto">
                      <VibeNotesForm
                        profileSlug={slug}
                        onNoteAdded={handleVibeNoteAdded}
                      />
                    </div>
                  )}
                  {!user && !isOwnProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 text-center max-w-2xl mx-auto"
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
                  <div className="max-w-2xl mx-auto">
                    <div className="mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vibe Notes</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">What others think about {isOwnProfile ? 'your' : 'their'} musical taste</p>
                      </div>
                    </div>
                    {vibeNotesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                      </div>
                    ) : vibeNotes.length > 0 ? (
                      <div className="space-y-3">
                        <AnimatePresence>
                          {vibeNotes.map((note: any) => (
                            <VibeNote key={note._id} note={note} isOwner={user && note.authorId && user._id === note.authorId._id} onDelete={handleDeleteNote} />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No vibe notes yet</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isOwnProfile ? "No one has left you a vibe note yet. Share your profile to get some!" : "Be the first to leave a vibe note about their musical taste!"}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </motion.button>

              {mounted && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6 pb-24">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <ProfileSection
                profile={profile}
                recentTracks={recentTracks}
                shortTracks={shortTracks}
                longTracks={longTracks}
                longArtists={longArtists}
                setActiveSection={setActiveSection}
                openSpotifyUrl={openSpotifyUrl}
                isOwnProfile={isOwnProfile}
                onBookmarkMoment={() => setShowBookmarkModal(true)}
                user={user}
                followCounts={followCounts}
                handleFollowToggle={handleFollowToggle}
                handleFollowCountClick={handleFollowCountClick}
                followMutation={followMutation}
                unfollowMutation={unfollowMutation}
                handleReaction={handleReaction}
              />
            )}
            {activeSection === 'artists' && (
              <ArtistsSection
                artists={currentArtists}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                timeRangeLabels={timeRangeLabels}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'tracks' && (
              <TracksSection
                tracks={currentTracks}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                timeRangeLabels={timeRangeLabels}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'recent' && (
              <RecentSection
                recentTracks={recentTracks}
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'playlists' && (
              <PlaylistsSection
                playlists={
                  profile.spotifyProfile?.playlists?.items || []
                }
                openSpotifyUrl={openSpotifyUrl}
              />
            )}
            {activeSection === 'bookmarks' && (
              <BookmarksSection
                bookmarks={bookmarks}
                loading={bookmarksLoading}
                isOwnProfile={isOwnProfile}
                onPlayAtTimestamp={openSpotifyAtTimestamp}
                onDeleteBookmark={handleDeleteBookmark}
                onEditBookmark={handleEditBookmark}
                editingBookmarkId={editingBookmarkId}
                editCaption={editCaption}
                setEditingBookmarkId={setEditingBookmarkId}
                setEditCaption={setEditCaption}
                onEditSave={(id: string) => handleEditBookmark(id, editCaption)}
                onEditCancel={() => setEditingBookmarkId(null)}
                profile={profile}
                openSpotifyAtTimestamp={openSpotifyAtTimestamp}
              />
            )}
            {activeSection === 'vibe_notes' && (
              <motion.div
                key="vibes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Vibe Notes Form (for others) */}
                {user && !isOwnProfile && (
                  <div className="max-w-2xl mx-auto">
                    <VibeNotesForm
                      profileSlug={slug}
                      onNoteAdded={handleVibeNoteAdded}
                    />
                  </div>
                )}
                {!user && !isOwnProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 text-center max-w-2xl mx-auto"
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
                <div className="max-w-2xl mx-auto">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vibe Notes</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">What others think about {isOwnProfile ? 'your' : 'their'} musical taste</p>
                    </div>
                  </div>
                  {vibeNotesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                  ) : vibeNotes.length > 0 ? (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {vibeNotes.map((note: any) => (
                          <VibeNote key={note._id} note={note} isOwner={user && note.authorId && user._id === note.authorId._id} onDelete={handleDeleteNote} />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No vibe notes yet</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{isOwnProfile ? "No one has left you a vibe note yet. Share your profile to get some!" : "Be the first to leave a vibe note about their musical taste!"}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50">
          <div className="flex justify-around py-2">
            {sidebarItems.map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveSection(id as Section)}
                className={`relative flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  activeSection === id
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
                {/* Hide label on mobile, show on sm+ */}
                <span className="hidden sm:block text-xs font-medium">{label}</span>
                {/* Green dot for active tab (mobile only) */}
                {activeSection === id && (
                  <span className="block sm:hidden mt-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

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
  );
}

// Profile Section Component
function ProfileSection({
  profile,
  recentTracks,
  shortTracks,
  longTracks,
  longArtists,
  setActiveSection,
  openSpotifyUrl,
  isOwnProfile,
  onBookmarkMoment,
  user,
  followCounts,
  handleFollowToggle,
  handleFollowCountClick,
  followMutation,
  unfollowMutation,
  handleReaction,
}: any) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4 mb-4"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Avatar */}
          <motion.img
            whileHover={{ scale: 1.04 }}
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="w-14 h-14 rounded-full object-cover shadow ring-2 ring-green-100 dark:ring-green-900 mb-2 md:mb-0"
          />

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {profile.displayName}
              </h1>
              {/* Follow Button */}
              {!isOwnProfile && user && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all flex items-center gap-1.5 ${
                    profile.isFollowing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {profile.isFollowing ? (
                    <>
                      <UserMinus className="w-3 h-3" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      Follow
                    </>
                  )}
                </motion.button>
              )}
              {/* Message Button for own profile */}
              {isOwnProfile && user && (
                <Link
                  href="/jam"
                  className="px-3 py-1.5 rounded-full font-medium text-xs bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5"
                >
                  <Music className="w-3 h-3" />
                  Create a Jam
                </Link>
              )}
            </div>
            {/* Follow Counts */}
            <div className="flex items-center gap-4 mb-2">
              {/* Spotify Followers (subtle) */}
              {profile.spotifyProfile?.followers && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{profile.spotifyProfile.followers.toLocaleString()}</span>
                  <span className="ml-1">Spotify followers</span>
                </div>
              )}
              {/* Sonder Followers (prominent) */}
              <button
                onClick={() => handleFollowCountClick('followers')}
                className="text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors text-xs"
              >
                <span className="font-semibold">{followCounts.followerCount}</span>
                <span className="ml-1">followers</span>
              </button>
              <button
                onClick={() => handleFollowCountClick('following')}
                className="text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors text-xs"
              >
                <span className="font-semibold">{followCounts.followingCount}</span>
                <span className="ml-1">following</span>
              </button>
            </div>
            {/* Vibe Summary */}
            <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-snug">
              {profile.vibeSummary}
            </p>
          </div>
        </div>
        {/* Now Playing */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {profile.nowPlaying ? (
            <div className="flex flex-row items-center justify-between gap-3 w-full">
              {/* Album art */}
              <motion.div
                className="relative flex-shrink-0"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <img
                  src={profile.nowPlaying.albumArt}
                  alt={profile.nowPlaying.album}
                  className="w-12 h-12 rounded-md shadow-lg"
                />
                <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
                  {profile.nowPlaying.isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white" />
                  )}
                </div>
              </motion.div>

              {/* Now Playing text and progress */}
              <div className="flex-1 min-w-0 w-full max-w-full px-2">
                <div className="flex items-center space-x-2">
                  <motion.span
                    animate={
                      profile.nowPlaying.isPlaying
                        ? { scale: [1, 1.06, 1], backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
                        : { scale: 1 }
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 bg-[length:200%_200%] bg-clip-text text-transparent font-semibold text-xs"
                  >
                    Now Playing
                  </motion.span>
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold mt-1 w-full max-w-full overflow-hidden">
                  <MarqueeText text={profile.nowPlaying.song} />
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-full max-w-full overflow-hidden">
                  {profile.nowPlaying.artist} • {profile.nowPlaying.album}
                </p>

                {/* Progress Bar */}
                <div className="mt-1 space-y-1 w-full max-w-full">
                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-full max-w-full">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(profile.nowPlaying.progressMs / profile.nowPlaying.durationMs) * 100}%`
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeOut"
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 w-full max-w-full">
                    <span className="truncate">
                      {formatTime(profile.nowPlaying.progressMs)}
                    </span>
                    <span className="truncate">
                      {formatTime(profile.nowPlaying.durationMs)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons at the far right */}
              <div className="flex flex-col gap-1 items-end justify-end flex-shrink-0 ml-2">
                {profile.nowPlaying.previewUrl && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add preview play functionality here
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <PlayCircle className="w-5 h-5 text-green-500" />
                  </motion.button>
                )}
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmarkMoment();
                    }}
                    className="p-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors group"
                    title="Bookmark this moment"
                  >
                    <BookmarkPlus className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  </motion.button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                <Music2 className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Music Paused
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-1">
                  No music currently playing
                </h3>
              </div>
            </div>
          )}
        </div>
      </motion.div>


      {/* Reactions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm mb-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Reactions</h2>
        </div>
        {/* Already added reactions */}
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(profile.reactions || {}).map(([emoji, count]) => (
            <div
              key={emoji}
              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-xl text-sm text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <span className="text-base">{emoji}</span>
              <span className="font-medium">{String(count)}</span>
            </div>
          ))}
          {Object.keys(profile.reactions || {}).length === 0 && (
            <span className="text-xs text-gray-400 italic">No reactions yet</span>
          )}
        </div>
        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-2" />
        {/* Addable reactions */}
        {user && !isOwnProfile && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 mr-1">Add a reaction:</span>
            {['🔥','💜','😭','✨','🎵','👍','😍','😂','😎','🤯','🥳','🫶'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-lg w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-200 dark:focus:ring-purple-700"
                aria-label={`Add reaction ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recently Played Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recently Played</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('recent')}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {recentTracks.slice(0, 12).map((item: any, index: number) => (
            <motion.div
              key={`${item.trackId}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(item.trackUrl)}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square bg-gray-200 dark:bg-gray-800"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.trackName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {item.trackName}
                </h3>
                <p className="text-xs opacity-80">
                  {timeAgo(new Date(item.playedAt))}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Songs I Love Right Now Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Songs I love right now
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('tracks')}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {shortTracks.slice(0, 12).map((track: any, index: number) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={track.album.imageUrl}
                alt={track.album.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {track.name}
                </h3>
                <p className="text-xs opacity-80 truncate">
                  {track.artists.map((a: any) => a.name).join(', ')}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* My All Time Fav Tracks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            My All Time fav tracks
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('tracks')}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {longTracks.slice(0, 12).map((track: any, index: number) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={track.album.imageUrl}
                alt={track.album.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {track.name}
                </h3>
                <p className="text-xs opacity-80 truncate">
                  {track.artists.map((a: any) => a.name).join(', ')}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Playlists Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Playlists</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('playlists')}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {profile.spotifyProfile?.playlists?.items
            ?.slice(0, 12)
            .map((playlist: any, index: number) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => openSpotifyUrl(playlist.url)}
                className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
              >
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden">
                  {playlist.imageUrl ? (
                    <img
                      src={playlist.imageUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <List className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-xs font-semibold truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-xs opacity-80">
                    {playlist.tracks} tracks
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3 h-3 text-white" />
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* My All Time Fav Artists Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            My All Time fav artists
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('artists')}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            See more
          </motion.button>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {longArtists.slice(0, 12).map((artist: any, index: number) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(artist.url)}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xs font-semibold truncate">
                  {artist.name}
                </h3>
                <p className="text-xs opacity-80">
                  {artist.followers?.toLocaleString()} followers
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Artists Section Component
function ArtistsSection({
  artists,
  timeRange,
  setTimeRange,
  timeRangeLabels,
  openSpotifyUrl,
}: any) {
  return (
    <motion.div
      key="artists"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6 md:mb-0 text-center md:text-left w-full md:w-auto">
          Top Artists
        </h1>
        {/* Time Range Tabs */}
        <div className="flex justify-center md:justify-end w-full md:w-auto">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            {(Object.keys(timeRangeLabels) as any[]).map((range) => (
              <motion.button
                key={range}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {timeRangeLabels[range]}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {artists.map((artist: any, index: number) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => openSpotifyUrl(artist.url)}
            className="text-center cursor-pointer group"
          >
            <div className="relative mb-3">
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full aspect-square rounded-full object-cover shadow-lg"
              />
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            <h3 className="font-semibold text-sm truncate">
              {artist.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {artist.followers?.toLocaleString()} followers
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Tracks Section Component
function TracksSection({
  tracks,
  timeRange,
  setTimeRange,
  timeRangeLabels,
  openSpotifyUrl,
}: any) {
  return (
    <motion.div
      key="tracks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6">
          Top Tracks
        </h1>

        {/* Time Range Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            {(Object.keys(timeRangeLabels) as any[]).map((range) => (
              <motion.button
                key={range}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {timeRangeLabels[range]}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-3">
          {tracks.map((track: any, index: number) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => openSpotifyUrl(track.url)}
              className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={track.album.imageUrl}
                  alt={track.album.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4 fill-white" />
                </motion.div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">
                  {track.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {track.artists.map((a: any) => a.name).join(', ')} •{' '}
                  {track.album.name}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {formatDuration(track.durationMs)}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Recent Section Component
function RecentSection({ recentTracks, openSpotifyUrl }: any) {
  return (
    <motion.div
      key="recent"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">
          Recently Played Tracks
        </h1>

        {/* Recent Tracks List */}
        <div className="space-y-3">
          {recentTracks.map((item: any, index: number) => (
            <motion.div
              key={`${item.trackId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => openSpotifyUrl(item.trackUrl)}
              className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.trackName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">
                  {item.trackName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{timeAgo(new Date(item.playedAt))}</span>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {formatDuration(item.durationMs)}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Playlists Section Component
function PlaylistsSection({ playlists, openSpotifyUrl }: any) {
  return (
    <motion.div
      key="playlists"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold mb-8">
          Playlists
        </h1>

        {/* Playlists Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist: any, index: number) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => openSpotifyUrl(playlist.url)}
              className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {playlist.imageUrl ? (
                  <img
                    src={playlist.imageUrl}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <List className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="font-semibold text-sm truncate mb-1">
                {playlist.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {playlist.tracks} tracks
              </p>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <ExternalLink className="w-4 h-4 mx-auto" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Bookmarks Section Component
function BookmarksSection({
  bookmarks,
  loading,
  isOwnProfile,
  onPlayAtTimestamp,
  onDeleteBookmark,
  onEditBookmark,
  editingBookmarkId,
  editCaption,
  setEditingBookmarkId,
  setEditCaption,
  onEditSave,
  onEditCancel,
  profile,
  openSpotifyAtTimestamp,
}: any) {
  return (
    <motion.div
      key="bookmarks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className=""
    >
      {/* Subtle Instructional Banner */}
      <div className="mb-5">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-600 dark:text-gray-300 text-sm">
          <Info className="w-4 h-4 text-green-400" />
          <span>
            Play a song on <span className="font-medium text-green-600">Spotify</span>, then open your <span className="font-medium text-green-600">Sonder.fm</span> profile to bookmark that exact moment in the song.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : !bookmarks.length ? (
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/40 dark:to-emerald-800/40 rounded-2xl p-8 max-w-md mx-auto"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No bookmarks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {isOwnProfile
                ? 'Start playing a song on Spotify, then visit your profile to bookmark special moments!'
                : `${profile.displayName} hasn't bookmarked any musical moments yet.`}
            </p>
            {isOwnProfile && (
              <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-2">
                <Info className="w-4 h-4" />
                <span>Play music → Visit profile → Click bookmark icon</span>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarks.map((bookmark: any, index: number) => (
            <motion.div
              key={bookmark._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group p-3 sm:p-4 flex flex-col h-full bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Album Art */}
                <div className="relative flex-shrink-0">
                  <img
                    src={bookmark.metadata.album.imageUrl}
                    alt={bookmark.metadata.album.name}
                    onClick={() => {
                      console.log('Album clicked:', bookmark.metadata.spotifyUrl, bookmark.timestampMs);
                      openSpotifyAtTimestamp(bookmark.metadata.spotifyUrl, bookmark.timestampMs);
                    }}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover shadow-md border-2 border-white dark:border-gray-900 cursor-pointer hover:scale-105 transition-transform relative z-10"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                      {bookmark.metadata.name}
                    </h3>
                    <Tooltip content={`The moment saved in the song.`}>
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full px-2 py-0.5 cursor-pointer">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {formatTime(bookmark.timestampMs)}
                        </span>
                      </div>
                    </Tooltip>
                    {/* Tiny progress bar with marker (fixed for visibility) */}
                    <div className="mt-1 w-24 h-6 flex items-center relative">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-800 z-10" />
                      {/* Marker: if duration is available, use it; else, use 50% */}
                      {bookmark.durationMs ? (
                        <div
                          className="absolute top-1/2 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow -translate-x-1/2 -translate-y-1/2 z-20"
                          style={{ left: `${Math.min(100, Math.max(0, (bookmark.timestampMs / bookmark.durationMs) * 100))}%` }}
                        />
                      ) : (
                        <div
                          className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow -translate-x-1/2 -translate-y-1/2 z-20"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs truncate mb-1">
                    {bookmark.metadata.artists.map((a: any) => a.name).join(', ')}
                  </p>

                  {/* Caption */}
                  {editingBookmarkId === bookmark._id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Add a caption..."
                        className="flex-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        maxLength={500}
                        autoFocus
                      />
                      <button
                        onClick={() => onEditSave(bookmark._id)}
                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={onEditCancel}
                        className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : bookmark.caption ? (
                    <p className="text-gray-700 dark:text-gray-300 text-xs italic mt-1 line-clamp-2">
                      "{bookmark.caption}"
                    </p>
                  ) : null}

                  <p className="text-gray-500 text-xs mt-1">
                    {timeAgo(new Date(bookmark.createdAt))}
                  </p>

                  {/* Actions Row - right-aligned, own line */}
                  <div className="flex gap-2 mt-3 justify-end">
                    {isOwnProfile && (
                      <>
                        <button
                          onClick={() => {
                            setEditingBookmarkId(bookmark._id);
                            setEditCaption(bookmark.caption || '');
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-transparent hover:border-blue-300 dark:hover:border-blue-700 bg-transparent hover:bg-blue-100/60 dark:hover:bg-blue-900/40 text-blue-500 dark:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                          title="Edit caption"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteBookmark(bookmark._id)}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-transparent hover:border-red-300 dark:hover:border-red-700 bg-transparent hover:bg-red-100/60 dark:hover:bg-red-900/40 text-red-500 dark:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                          title="Delete bookmark"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}