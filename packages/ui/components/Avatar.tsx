import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  online,
  className = ''
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative ${className}`}>
      <motion.img
        whileHover={{ scale: 1.05 }}
        src={src}
        alt={alt}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/20 shadow-lg`}
      />
      {online && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"
        />
      )}
    </div>
  );
};