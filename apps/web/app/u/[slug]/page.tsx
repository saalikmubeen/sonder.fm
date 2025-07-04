'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Music,
  Heart,
  MessageCircle,
  Bookmark,
  Users,
  Calendar,
  ExternalLink,
  Edit3,
  Save,
  X,
  Clock,
  Play,
  Trash2,
  UserPlus,
  UserMinus,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { profileApi, followApi, bookmarkApi } from '@/lib/api';
import { formatTime, timeAgo } from '@sonder/utils';
import { NowPlaying } from '@sonder/ui';
import BookmarkModal from '@/components/BookmarkModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ProfileData {
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
  profileTheme: string;
  vibeSummary: string;
  nowPlaying?: any;
  reactions: { [emoji: string]: number };
  vibeNotes: any[];
  isFollowing?: boolean;
  spotifyProfile?: any;
}

interface FollowCounts {
  followerCount: number;
  followingCount: number;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState('profile');
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', slug],
    queryFn: () => profileApi.getProfile(slug),
  });

  // Fetch follow counts
  const { data: followCounts } = useQuery({
    queryKey: ['followCounts', slug],
    queryFn: () => followApi.getFollowCounts(slug),
  });

  // Fetch bookmarks
  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarks', slug],
    queryFn: () => bookmarkApi.getBookmarksForUser(slug),
    enabled: activeTab === 'bookmarks',
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

  // Bookmark mutations
  const createBookmarkMutation = useMutation({
    mutationFn: (data: { caption: string }) => {
      if (!profile?.nowPlaying) throw new Error('No song playing');
      
      return bookmarkApi.createBookmark({
        trackId: profile.nowPlaying.spotifyUrl.split('/').pop() || '',
        timestampMs: profile.nowPlaying.progressMs,
        durationMs: profile.nowPlaying.durationMs,
        caption: data.caption,
        metadata: {
          name: profile.nowPlaying.song,
          artists: [{ name: profile.nowPlaying.artist }],
          album: {
            name: profile.nowPlaying.album,
            imageUrl: profile.nowPlaying.albumArt,
          },
          spotifyUrl: profile.nowPlaying.spotifyUrl,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', slug] });
      setShowBookmarkModal(false);
      toast.success('Moment bookmarked! 📍');
    },
    onError: () => toast.error('Failed to create bookmark'),
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: ({ id, caption }: { id: string; caption: string }) =>
      bookmarkApi.updateBookmark(id, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', slug] });
      setEditingBookmark(null);
      toast.success('Bookmark updated');
    },
    onError: () => toast.error('Failed to update bookmark'),
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) => bookmarkApi.deleteBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', slug] });
      toast.success('Bookmark deleted');
    },
    onError: () => toast.error('Failed to delete bookmark'),
  });

  const profile: ProfileData = profileData?.data;
  const counts: FollowCounts = followCounts?.data || { followerCount: 0, followingCount: 0 };
  const bookmarks = bookmarksData?.data?.bookmarks || [];

  const isOwnProfile = user?.publicSlug === slug;
  const isLoggedIn = !!user;

  const handleBookmarkSave = (caption: string) => {
    createBookmarkMutation.mutate({ caption });
  };

  const handleEditBookmark = (bookmark: any) => {
    setEditingBookmark(bookmark._id);
    setEditCaption(bookmark.caption || '');
  };

  const handleSaveEdit = (bookmarkId: string) => {
    updateBookmarkMutation.mutate({ id: bookmarkId, caption: editCaption });
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      deleteBookmarkMutation.mutate(bookmarkId);
    }
  };

  const handleFollowToggle = () => {
    if (!isLoggedIn) {
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
    if (!isLoggedIn) {
      toast.error('Please log in to view followers');
      return;
    }
    router.push(`/u/${slug}/following?tab=${type}`);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profile not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This user doesn't exist or has been removed.
          </p>
        </div>
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
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-green-100 dark:ring-green-900"
            />

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.displayName}
                </h1>
                
                {/* Follow Button */}
                {!isOwnProfile && isLoggedIn && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                      profile.isFollowing
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {profile.isFollowing ? (
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

                {/* Message Button for own profile */}
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </motion.button>
                )}
              </div>

              {/* Follow Counts */}
              <div className="flex items-center gap-6 mb-4">
                {/* Spotify Followers (subtle) */}
                {profile.spotifyProfile?.followers && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{profile.spotifyProfile.followers.toLocaleString()}</span>
                    <span className="ml-1">Spotify followers</span>
                  </div>
                )}

                {/* Sonder Followers (prominent) */}
                <button
                  onClick={() => handleFollowCountClick('followers')}
                  className="text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  <span className="font-semibold text-lg">{counts.followerCount}</span>
                  <span className="ml-1 text-sm">followers</span>
                </button>

                <button
                  onClick={() => handleFollowCountClick('following')}
                  className="text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  <span className="font-semibold text-lg">{counts.followingCount}</span>
                  <span className="ml-1 text-sm">following</span>
                </button>
              </div>

              {/* Vibe Summary */}
              <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">
                {profile.vibeSummary}
              </p>
            </div>
          </div>

          {/* Now Playing */}
          {profile.nowPlaying && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <NowPlaying nowPlaying={profile.nowPlaying} compact />
                
                {/* Bookmark Button */}
                {isOwnProfile && profile.nowPlaying.isPlaying && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBookmarkModal(true)}
                    className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    title="Bookmark this moment"
                  >
                    <Bookmark className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex">
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'artists', icon: Music, label: 'Top Artists' },
              { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 transition-all relative ${
                  activeTab === tab.id
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden md:inline font-medium">{tab.label}</span>
                
                {/* Mobile active indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full md:hidden"
                  />
                )}
                
                {/* Desktop active indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 hidden md:block"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Reactions */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Reactions
                </h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(profile.reactions).map(([emoji, count]) => (
                    <div
                      key={emoji}
                      className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-full"
                    >
                      <span className="text-lg">{emoji}</span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vibe Notes */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  Vibe Notes
                </h3>
                <div className="space-y-4">
                  {profile.vibeNotes.map((note) => (
                    <div
                      key={note._id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                    >
                      <p className="text-gray-800 dark:text-gray-200 italic mb-2">
                        "{note.note}"
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {note.isAnonymous ? 'Anonymous' : note.authorId?.displayName}
                        </span>
                        <span>{timeAgo(new Date(note.createdAt))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'artists' && (
            <motion.div
              key="artists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Music className="w-5 h-5 text-green-500" />
                Top Artists
              </h3>
              
              {profile.spotifyProfile?.topArtists?.short?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profile.spotifyProfile.topArtists.short.slice(0, 12).map((artist: any) => (
                    <motion.div
                      key={artist.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-lg transition-all"
                    >
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                      />
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {artist.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {artist.followers?.toLocaleString()} followers
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No top artists data available
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'bookmarks' && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-purple-500" />
                Bookmarked Moments
              </h3>

              {bookmarks.length > 0 ? (
                <div className="space-y-3">
                  {bookmarks.map((bookmark: any) => (
                    <motion.div
                      key={bookmark._id}
                      whileHover={{ scale: 1.01, y: -1 }}
                      className="group bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Album Art */}
                        <div className="relative">
                          <img
                            src={bookmark.metadata.album.imageUrl}
                            alt={bookmark.metadata.album.name}
                            className="w-12 h-12 rounded-lg object-cover shadow-sm"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const spotifyUrl = `${bookmark.metadata.spotifyUrl}#${Math.floor(bookmark.timestampMs / 1000)}`;
                              window.open(spotifyUrl, '_blank');
                            }}
                            className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Play className="w-4 h-4 text-white" />
                          </motion.button>
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {bookmark.metadata.name}
                            </h4>
                            <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              {formatTime(bookmark.timestampMs)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {bookmark.metadata.artists.map((a: any) => a.name).join(', ')}
                          </p>
                          
                          {/* Caption */}
                          {editingBookmark === bookmark._id ? (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Add a caption..."
                                maxLength={500}
                              />
                              <button
                                onClick={() => handleSaveEdit(bookmark._id)}
                                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingBookmark(null)}
                                className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : bookmark.caption ? (
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 italic">
                              "{bookmark.caption}"
                            </p>
                          ) : null}
                        </div>

                        {/* Actions */}
                        {isOwnProfile && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditBookmark(bookmark)}
                              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBookmark(bookmark._id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-8 h-8 text-purple-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No bookmarks yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                    {isOwnProfile 
                      ? "Start playing music on Spotify, then visit your profile to bookmark special moments in songs"
                      : `${profile.displayName} hasn't bookmarked any moments yet`
                    }
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={showBookmarkModal}
        onClose={() => setShowBookmarkModal(false)}
        onSave={handleBookmarkSave}
        loading={createBookmarkMutation.isPending}
        trackInfo={
          profile?.nowPlaying
            ? {
                name: profile.nowPlaying.song,
                artist: profile.nowPlaying.artist,
                album: profile.nowPlaying.album,
                albumArt: profile.nowPlaying.albumArt,
                timestampMs: profile.nowPlaying.progressMs,
              }
            : {
                name: '',
                artist: '',
                album: '',
                albumArt: '',
                timestampMs: 0,
              }
        }
      />
    </div>
  );
}