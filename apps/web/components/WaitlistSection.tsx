'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  User,
  ArrowRight,
  Check,
  Users,
  Gift,
  Copy,
  ExternalLink,
  Sparkles,
  Heart,
  Share2,
} from 'lucide-react';
import { waitlistApi } from '@/lib/waitlist-api';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface WaitlistSectionProps {
  referrer?: string;
}

export default function WaitlistSection({
  referrer,
}: WaitlistSectionProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    position: number;
    referralCode: string;
    totalCount: number;
  } | null>(null);

  // Get waitlist count
  const { data: countData } = useQuery({
    queryKey: ['waitlist-count'],
    queryFn: waitlistApi.getCount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get referrer info if referrer code is provided
  const { data: referrerData } = useQuery({
    queryKey: ['referrer-stats', referrer],
    queryFn: () =>
      referrer ? waitlistApi.getReferralStats(referrer) : null,
    enabled: !!referrer,
  });

  const totalCount = countData?.data?.total || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await waitlistApi.join({
        email: email.trim(),
        name: name.trim() || undefined,
        referrer: referrer || undefined,
      });

      setSubmissionData(response.data);
      setIsSubmitted(true);
      toast.success('Welcome to the waitlist! 🎵');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("You're already on the waitlist!");
      } else {
        toast.error(
          error.response?.data?.error || 'Failed to join waitlist'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReferralLink = () => {
    if (submissionData?.referralCode) {
      const referralUrl = `${window.location.origin}?ref=${submissionData.referralCode}`;
      navigator.clipboard.writeText(referralUrl);
      toast.success('Referral link copied! 📋');
    }
  };

  const shareReferralLink = () => {
    if (submissionData?.referralCode && navigator.share) {
      const referralUrl = `${window.location.origin}?ref=${submissionData.referralCode}`;
      navigator.share({
        title: 'Join me on Sonder.fm',
        text: 'Check out Sonder.fm - the beautiful way to share your musical soul!',
        url: referralUrl,
      });
    }
  };

  if (isSubmitted && submissionData) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16"
      >
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
            }}
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-8 h-8 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
          >
            You&apos;re In! 🎉
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-6"
          >
            Welcome to the Sonder.fm family. You&apos;re #
            {submissionData.position} in line.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-800"
          >
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  #{submissionData.position}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Your Position
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {submissionData.totalCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Members
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {submissionData.referralCode}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Referral Code
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Invite Friends & Move Up!
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Share your referral link and move up the waitlist for
              each friend who joins.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={copyReferralLink}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm"
              >
                <Copy className="w-3 h-3" />
                Copy Link
              </button>
              {'share' in navigator &&
                typeof navigator.share === 'function' && (
                  <button
                    onClick={shareReferralLink}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg text-sm"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                )}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            We&apos;ll email you when it&apos;s your turn to join the
            musical revolution.
          </motion.p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="py-16"
    >
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
          >
            Join the Waitlist
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            Be among the first to experience the future of music
            sharing.
          </motion.p>

          {totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 mt-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 dark:border-gray-800"
            >
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {totalCount.toLocaleString()} joined
              </span>
            </motion.div>
          )}

          {referrer && referrerData?.data && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full"
            >
              <Heart className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Invited by {referrerData.data.name || 'a friend'}
              </span>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (optional)"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
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
                <>
                  Join Waitlist
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Benefits Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6 text-center"
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                  Early Access
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Be first to experience the future of music sharing
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                  <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                  Exclusive Perks
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Special features and benefits for early members
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                  Shape the Future
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your feedback will help us build the perfect
                  platform
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
