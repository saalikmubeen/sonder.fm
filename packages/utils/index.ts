export * from './crypto';
export * from './spotify';
export * from './openai';

export const generateRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#54a0ff', '#2e86de', '#a29bfe', '#6c5ce7', '#fd79a8'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const timeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getThemeColors = (theme: string) => {
  const themes = {
    default: {
      bg: 'bg-white',
      text: 'text-gray-900',
      accent: 'text-blue-600',
      border: 'border-gray-200'
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-white',
      accent: 'text-emerald-400',
      border: 'border-gray-700'
    },
    pastel: {
      bg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50',
      text: 'text-gray-800',
      accent: 'text-purple-600',
      border: 'border-purple-200'
    },
    grunge: {
      bg: 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900',
      text: 'text-gray-100',
      accent: 'text-orange-400',
      border: 'border-gray-600'
    },
    sadcore: {
      bg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
      text: 'text-gray-100',
      accent: 'text-pink-400',
      border: 'border-purple-500'
    }
  };
  
  return themes[theme as keyof typeof themes] || themes.default;
};