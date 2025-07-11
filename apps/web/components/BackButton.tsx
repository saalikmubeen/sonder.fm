import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

export default function BackButton({ className = '', label = 'Back', onClick }: { className?: string; label?: string; onClick?: () => void }) {
  const router = useRouter();
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick ? onClick : () => router.back()}
      className={`p-2 rounded-full bg-white/80 dark:bg-black/80 border border-gray-200 dark:border-gray-800 shadow hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center ${className}`}
      aria-label={label}
      title={label}
    >
      <ChevronRight className="w-5 h-5 rotate-180 text-gray-700 dark:text-gray-200" />
    </motion.button>
  );
}