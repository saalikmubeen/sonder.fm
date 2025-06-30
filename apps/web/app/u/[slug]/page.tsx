"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Avatar from "@/components/Avatar";
import NowPlaying from "@/components/NowPlaying";
import ReactionBar from "@/components/ReactionBar";
import VibeNote from "@/components/VibeNote";
import FollowButton from "@/components/FollowButton";
import ThemePicker from "@/components/ThemePicker";
import { getThemeClasses } from "@/lib/theme-utils";

interface UserProfile {
  displayName: string;
  avatarUrl: string;
  publicSlug: string;
  profileTheme: string;
  vibeSummary: string;
  nowPlaying?: {
    song: string;
    artist: string;
    albumArt: string;
    timestamp: string;
  };
  stats: {
    followers: number;
    following: number;
    topGenres: string[];
    totalMinutesListened: number;
  };
  reactions: { [emoji: string]: number };
  vibeNotes: { note: string; authorId?: string }[];
  isFollowing?: boolean;
}

export default function UserProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5001/profile/${slug}`); // Proxy to backend
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data.data);
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchProfile();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Profile not found.</div>;
  }

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-4 ${getThemeClasses(profile.profileTheme)}`}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl p-8">
        {/* Avatar + Display Name */}
        <div className="flex flex-col items-center mb-6">
          <Avatar src={profile.avatarUrl} name={profile.displayName} />
        </div>
        {/* Now Playing */}
        {profile.nowPlaying && (
          <NowPlaying song={profile.nowPlaying.song} artist={profile.nowPlaying.artist} albumArt={profile.nowPlaying.albumArt} />
        )}
        {/* Vibe Summary */}
        <div className="my-4 text-center text-xl italic font-medium text-indigo-700 dark:text-indigo-200">
          {profile.vibeSummary}
        </div>
        {/* Reactions */}
        <div className="flex space-x-4 mb-4 justify-center">
          <ReactionBar />
        </div>
        {/* Vibe Notes */}
        <div className="mb-4">
          {profile.vibeNotes.map((note, i) => (
            <VibeNote key={i} note={note.note} author={note.authorId} />
          ))}
        </div>
        {/* Follow Button + Theme Picker */}
        <div className="flex justify-between items-center">
          <FollowButton isFollowing={profile.isFollowing} />
          <ThemePicker />
        </div>
      </motion.div>
    </main>
  );
}