'use client';

import { motion } from 'framer-motion';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import {
  Music,
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  Moon,
  LogIn,
} from 'lucide-react';
import { Button } from '@sonder/ui';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
];

export default function HomePage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (user) {
    router.push(`/u/${user.publicSlug}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-20 w-full bg-white/70 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 relative">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">
              Sonder.fm
            </span>
          </div>
          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 text-base font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          {/* Auth/CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 transition-colors"
              onClick={handleLogin}
            >
              <LogIn className="w-4 h-4 mr-2" /> Log in
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="border border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-6 py-2 ml-2 transition-colors font-medium"
              onClick={handleLogin}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          {/* Hamburger (Mobile) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Open menu"
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="text-gray-700 dark:text-gray-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-16 mt-2 w-56 rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 z-50 animate-fade-in flex flex-col p-4 gap-2">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="my-2 border-gray-200 dark:border-gray-800" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 px-3 py-2"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setIsMenuOpen(false);
                  }}
                  aria-label="Toggle theme"
                >
                  <Moon className="w-4 h-4 mr-2" /> Toggle Theme
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 transition-colors"
                  onClick={() => {
                    handleLogin();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" /> Log in
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start border border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-2 transition-colors font-medium"
                  onClick={() => {
                    handleLogin();
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="w-full"
        >
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-5 py-1.5 mb-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
              Modern Music Social
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
              Connect. Share.{' '}
              <span className="text-green-600 dark:text-green-400">
                Vibe.
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 mb-10">
              Sonder.fm is the new way to showcase your music taste,
              discover new sounds, and connect with friends—all in a
              beautiful, modern experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 text-lg shadow rounded-full"
              >
                Start Free Trial
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-8 py-4 rounded-full"
              >
                Book a Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-14"
          >
            Why Sonder.fm?
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Sparkles className="w-7 h-7" />}
              title="Personalized Feed"
              description="See what your friends are listening to and discover new music tailored to your taste."
            />
            <FeatureCard
              icon={<Users className="w-7 h-7" />}
              title="Social Profiles"
              description="Showcase your top tracks, artists, and playlists in a beautiful profile."
            />
            <FeatureCard
              icon={<Music className="w-7 h-7" />}
              title="Live Now Playing"
              description="Share your current vibe in real time with a live now playing status."
            />
            <FeatureCard
              icon={<Heart className="w-7 h-7" />}
              title="Reactions & Messages"
              description="React to friends' music and send messages to connect instantly."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Sign Up"
              description="Create your free Sonder.fm account and connect your Spotify."
              delay={0.1}
            />
            <StepCard
              number="2"
              title="Personalize"
              description="Customize your profile and set your music preferences."
              delay={0.2}
            />
            <StepCard
              number="3"
              title="Connect"
              description="Find friends, follow, and start sharing your vibes."
              delay={0.3}
            />
            <StepCard
              number="4"
              title="Enjoy"
              description="Discover, react, and message—enjoy music together!"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800 py-8 bg-white/70 dark:bg-gray-950/80 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>
            &copy; {new Date().getFullYear()} Sonder.fm. All rights
            reserved.
          </span>
          <div className="flex gap-4">
            <a
              href="#features"
              className="hover:text-green-600 dark:hover:text-green-400"
            >
              Features
            </a>
            <a
              href="#how"
              className="hover:text-green-600 dark:hover:text-green-400"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="hover:text-green-600 dark:hover:text-green-400"
            >
              Pricing
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow p-8 flex flex-col items-start gap-4 transition-all duration-200 hover:shadow-xl"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white mb-2">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-base">
        {description}
      </p>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  description,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow p-6 flex flex-col items-center gap-2 text-center"
    >
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center font-bold text-lg mb-2">
        {number}
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h4>
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        {description}
      </p>
    </motion.div>
  );
}
