"use client";
import { motion } from "framer-motion";

export default function MessagesPage() {
  // TODO: Fetch messages by slug, connect to Socket.IO
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col h-[70vh]">
        {/* Message List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          <div className="h-8 w-32 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-8 w-48 bg-blue-100 dark:bg-blue-900 rounded" />
        </div>
        {/* Typing Indicator */}
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-2" />
        {/* Message Input */}
        <div className="flex items-center space-x-2">
          <input className="flex-1 px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Type a message..." disabled />
          <button className="px-4 py-2 rounded bg-green-500 text-white font-semibold" disabled>Send</button>
        </div>
      </motion.div>
    </main>
  );
}