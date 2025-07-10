export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  preview: {
    background: string;
    accent: string;
    text: string;
    border: string;
  };
  styles: {
    background: string;
    container: string;
    card: string;
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    border: string;
    button: {
      primary: string;
      secondary: string;
    };
    nowPlaying: {
      background: string;
      progress: string;
    };
    reactions: string;
    notes: string;
  };
  fonts?: {
    primary?: string;
    secondary?: string;
  };
  effects?: {
    blur?: boolean;
    glow?: boolean;
    grain?: boolean;
  };
}

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Classic',
    description: 'Clean and timeless',
    preview: {
      background: 'bg-white',
      accent: 'text-indigo-600',
      text: 'text-gray-900',
      border: 'border-gray-200',
    },
    styles: {
      background: 'bg-gray-50',
      container: 'bg-white',
      card: 'bg-white border border-gray-200 shadow-sm',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        accent: 'text-indigo-600',
      },
      border: 'border-gray-200',
      button: {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      },
      nowPlaying: {
        background: 'bg-gradient-to-r from-indigo-50 to-purple-50',
        progress: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      },
      reactions: 'bg-gray-50 hover:bg-gray-100',
      notes: 'bg-gray-50 border-l-4 border-l-indigo-500',
    },
  },

  dark: {
    id: 'dark',
    name: 'Midnight',
    description: 'Sleek and mysterious',
    preview: {
      background: 'bg-gray-900',
      accent: 'text-white',
      text: 'text-gray-100',
      border: 'border-gray-700',
    },
    styles: {
      background: 'bg-black',
      container: 'bg-gray-900',
      card: 'bg-gray-900 border border-gray-800 shadow-xl',
      text: {
        primary: 'text-white',
        secondary: 'text-gray-300',
        accent: 'text-gray-100',
      },
      border: 'border-gray-800',
      button: {
        primary: 'bg-white hover:bg-gray-100 text-black',
        secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
      },
      nowPlaying: {
        background: 'bg-gradient-to-r from-gray-800 to-gray-900',
        progress: 'bg-gradient-to-r from-white to-gray-300',
      },
      reactions: 'bg-gray-800 hover:bg-gray-700',
      notes: 'bg-gray-800 border-l-4 border-l-white',
    },
  },

  pastel: {
    id: 'pastel',
    name: 'Dreamy',
    description: 'Soft and ethereal',
    preview: {
      background: 'bg-pink-50',
      accent: 'text-pink-600',
      text: 'text-rose-900',
      border: 'border-pink-200',
    },
    styles: {
      background:
        'bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50',
      container: 'bg-white/80 backdrop-blur-sm',
      card: 'bg-white/90 border border-pink-200 shadow-lg backdrop-blur-sm',
      text: {
        primary: 'text-rose-900',
        secondary: 'text-rose-700',
        accent: 'text-pink-600',
      },
      border: 'border-pink-200',
      button: {
        primary:
          'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white',
        secondary: 'bg-pink-100 hover:bg-pink-200 text-pink-700',
      },
      nowPlaying: {
        background: 'bg-gradient-to-r from-pink-100 to-rose-100',
        progress: 'bg-gradient-to-r from-pink-500 to-rose-500',
      },
      reactions: 'bg-pink-50 hover:bg-pink-100',
      notes: 'bg-pink-50 border-l-4 border-l-pink-500',
    },
    fonts: {
      primary: 'font-serif',
    },
    effects: {
      blur: true,
    },
  },

  grunge: {
    id: 'grunge',
    name: 'Underground',
    description: 'Raw and authentic',
    preview: {
      background: 'bg-gray-900',
      accent: 'text-yellow-400',
      text: 'text-gray-100',
      border: 'border-yellow-600',
    },
    styles: {
      background:
        'bg-gradient-to-br from-gray-900 via-gray-800 to-black',
      container: 'bg-gray-900/95',
      card: 'bg-gray-800 border border-yellow-600/30 shadow-2xl',
      text: {
        primary: 'text-gray-100',
        secondary: 'text-gray-300',
        accent: 'text-yellow-400',
      },
      border: 'border-yellow-600/30',
      button: {
        primary:
          'bg-yellow-500 hover:bg-yellow-400 text-black font-bold',
        secondary:
          'bg-gray-700 hover:bg-gray-600 text-yellow-400 border border-yellow-600/30',
      },
      nowPlaying: {
        background: 'bg-gradient-to-r from-gray-800 to-yellow-900/20',
        progress: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
      },
      reactions:
        'bg-gray-800 hover:bg-gray-700 border border-yellow-600/20',
      notes: 'bg-gray-800 border-l-4 border-l-yellow-500',
    },
    fonts: {
      primary: 'font-mono',
    },
    effects: {
      grain: true,
    },
  },

  sadcore: {
    id: 'sadcore',
    name: 'Melancholy',
    description: 'Deep and contemplative',
    preview: {
      background: 'bg-slate-900',
      accent: 'text-sky-300',
      text: 'text-slate-200',
      border: 'border-sky-500',
    },
    styles: {
      background:
        'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900',
      container: 'bg-slate-900/90 backdrop-blur-md',
      card: 'bg-slate-800/80 border border-sky-500/20 shadow-2xl backdrop-blur-sm',
      text: {
        primary: 'text-slate-200',
        secondary: 'text-slate-400',
        accent: 'text-sky-300',
      },
      border: 'border-sky-500/20',
      button: {
        primary:
          'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white',
        secondary:
          'bg-slate-700/50 hover:bg-slate-600/50 text-sky-300 border border-sky-500/30',
      },
      nowPlaying: {
        background:
          'bg-gradient-to-r from-slate-800/80 to-blue-900/40',
        progress: 'bg-gradient-to-r from-sky-500 to-blue-500',
      },
      reactions:
        'bg-slate-800/50 hover:bg-slate-700/50 border border-sky-500/10',
      notes: 'bg-slate-800/60 border-l-4 border-l-sky-500',
    },
    effects: {
      blur: true,
      glow: true,
    },
  },

  neon: {
    id: 'neon',
    name: 'Cyberpunk',
    description: 'Electric and futuristic',
    preview: {
      background: 'bg-black',
      accent: 'text-cyan-400',
      text: 'text-green-400',
      border: 'border-cyan-500',
    },
    styles: {
      background: 'bg-black',
      container: 'bg-gray-900/95',
      card: 'bg-black border border-cyan-500/50 shadow-2xl shadow-cyan-500/20',
      text: {
        primary: 'text-green-400',
        secondary: 'text-cyan-300',
        accent: 'text-cyan-400',
      },
      border: 'border-cyan-500/50',
      button: {
        primary:
          'bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/50',
        secondary:
          'bg-transparent hover:bg-cyan-500/10 text-cyan-400 border border-cyan-500',
      },
      nowPlaying: {
        background: 'bg-gradient-to-r from-black to-cyan-900/20',
        progress: 'bg-gradient-to-r from-cyan-500 to-green-500',
      },
      reactions:
        'bg-gray-900/50 hover:bg-cyan-500/10 border border-cyan-500/30',
      notes: 'bg-gray-900/80 border-l-4 border-l-cyan-500',
    },
    fonts: {
      primary: 'font-mono',
    },
    effects: {
      glow: true,
    },
  },

  forest: {
    id: 'forest',
    name: 'Nature',
    description: 'Organic and grounding',
    preview: {
      background: 'bg-green-900',
      accent: 'text-emerald-400',
      text: 'text-green-100',
      border: 'border-emerald-500',
    },
    styles: {
      background:
        'bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900',
      container: 'bg-green-900/90',
      card: 'bg-green-800/80 border border-emerald-500/30 shadow-xl',
      text: {
        primary: 'text-green-100',
        secondary: 'text-green-300',
        accent: 'text-emerald-400',
      },
      border: 'border-emerald-500/30',
      button: {
        primary:
          'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white',
        secondary:
          'bg-green-800/50 hover:bg-green-700/50 text-emerald-400 border border-emerald-500/30',
      },
      nowPlaying: {
        background:
          'bg-gradient-to-r from-green-800/80 to-emerald-800/60',
        progress: 'bg-gradient-to-r from-emerald-500 to-green-500',
      },
      reactions: 'bg-green-800/50 hover:bg-green-700/50',
      notes: 'bg-green-800/60 border-l-4 border-l-emerald-500',
    },
  },

  sunset: {
    id: 'sunset',
    name: 'Golden Hour',
    description: 'Warm and nostalgic',
    preview: {
      background: 'bg-orange-100',
      accent: 'text-orange-600',
      text: 'text-amber-900',
      border: 'border-orange-300',
    },
    styles: {
      background:
        'bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100',
      container: 'bg-white/90 backdrop-blur-sm',
      card: 'bg-white/95 border border-orange-200 shadow-lg shadow-orange-200/50',
      text: {
        primary: 'text-amber-900',
        secondary: 'text-orange-700',
        accent: 'text-orange-600',
      },
      border: 'border-orange-200',
      button: {
        primary:
          'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white',
        secondary:
          'bg-orange-100 hover:bg-orange-200 text-orange-700',
      },
      nowPlaying: {
        background: 'bg-gradient-to-r from-orange-100 to-amber-100',
        progress: 'bg-gradient-to-r from-orange-500 to-amber-500',
      },
      reactions: 'bg-orange-50 hover:bg-orange-100',
      notes: 'bg-orange-50 border-l-4 border-l-orange-500',
    },
    effects: {
      blur: true,
    },
  },
};

export function getThemeConfig(themeId: string): ThemeConfig {
  return THEME_CONFIGS[themeId] || THEME_CONFIGS.default;
}

export function getThemeClasses(themeId: string) {
  const config = getThemeConfig(themeId);
  return config.styles;
}

export function getThemePreview(themeId: string) {
  const config = getThemeConfig(themeId);
  return config.preview;
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEME_CONFIGS);
}
