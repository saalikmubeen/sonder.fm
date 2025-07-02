'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  gradient = false,
}) => {
  const baseClasses =
    'rounded-2xl shadow-lg backdrop-blur-sm border border-white/20';
  const gradientClasses = gradient
    ? 'bg-gradient-to-br from-white/10 to-white/5'
    : 'bg-white/80 dark:bg-gray-800/80';

  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${baseClasses} ${gradientClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
};
