'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Palette, Sparkles, X } from 'lucide-react';
import {
  getAllThemes,
  // getThemeConfig,
  type ThemeConfig,
} from '@sonder/utils';
import { profileApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ThemeSelectorProps {
  currentTheme: string;
  userSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

function ThemePreviewCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const preview = theme.preview;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        isSelected
          ? 'border-purple-500 shadow-lg shadow-purple-500/25'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
      }`}
    >
      {/* Preview Background */}
      <div
        className={`${preview.background} p-4 h-32 relative overflow-hidden`}
      >
        {/* Background Effects */}
        {theme.effects?.blur && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm" />
        )}
        {theme.effects?.glow && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        )}
        {theme.effects?.grain && (
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        )}

        {/* Preview Content */}
        <div className="relative z-10">
          <div
            className={`w-8 h-8 rounded-full ${preview.accent.replace(
              'text-',
              'bg-'
            )} mb-2`}
          />
          <div
            className={`h-2 ${preview.text.replace(
              'text-',
              'bg-'
            )} rounded w-16 mb-1 opacity-80`}
          />
          <div
            className={`h-1.5 ${preview.text.replace(
              'text-',
              'bg-'
            )} rounded w-12 opacity-60`}
          />
        </div>

        {/* Selection Indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme Info */}
      <div className="p-3 bg-white dark:bg-gray-900">
        <h4
          className={`font-semibold text-sm ${
            theme.fonts?.primary || ''
          } text-gray-900 dark:text-white`}
        >
          {theme.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {theme.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function ThemeSelector({
  currentTheme,
  userSlug,
  isOpen,
  onClose,
}: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const queryClient = useQueryClient();
  const themes = getAllThemes();

  const updateThemeMutation = useMutation({
    mutationFn: (theme: string) =>
      profileApi.updateTheme(userSlug, theme),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['profile', userSlug],
      });
      toast.success('Theme updated! ✨');
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Failed to update theme'
      );
      setSelectedTheme(currentTheme); // Reset on error
    },
  });

  const handleSave = () => {
    if (selectedTheme !== currentTheme) {
      updateThemeMutation.mutate(selectedTheme);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
            >
              {/* Header */}
              <div className="relative p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Choose Your Vibe
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Select a theme that reflects your musical
                      aesthetic
                    </p>
                  </div>
                </div>
              </div>

              {/* Theme Grid */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {themes.map((theme) => (
                    <ThemePreviewCard
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme === theme.id}
                      onSelect={() => setSelectedTheme(theme.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTheme !== currentTheme ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Theme will be applied to your profile
                    </span>
                  ) : (
                    'Current theme selected'
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={updateThemeMutation.isPending}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updateThemeMutation.isPending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {selectedTheme !== currentTheme
                      ? 'Apply Theme'
                      : 'Close'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
