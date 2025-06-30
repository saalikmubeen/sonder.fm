"use client";
import { motion } from "framer-motion";

export default function FeedPage() {
  // TODO: Fetch feed data by slug
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Followed Users' Now Playing */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-100 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-4">
            <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        </div>
        {/* Similar Vibers */}
        <div>
          <div className="h-8 w-32 bg-pink-200 dark:bg-pink-900 rounded mb-2" />
          <div className="space-y-2">
            <div className="h-12 w-full bg-gray-50 dark:bg-gray-900 rounded" />
            <div className="h-12 w-full bg-gray-50 dark:bg-gray-900 rounded" />
          </div>
        </div>
      </motion.div>
    </main>
  );
}