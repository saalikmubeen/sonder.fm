'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Suspense } from 'react';

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
  Radio,
  Bookmark,
  List,
} from 'lucide-react';
import { Button } from '@sonder/ui';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import WaitlistSection from '@/components/WaitlistSection';
import { useSearchParams } from 'next/navigation';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { title } from 'process';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how' },
];

function ScreenshotsSection() {
  const desktopScreens = [
    '/jam_desktop.png',
    '/export_desktop.png',
    '/room_desktop.png',
  ];
  const mobileScreens = [
    '/profile_mobile.jpg',
    '/bookmarks_mobile.jpg',
    '/tracks_mobile.jpg',
  ];
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-6"
        >
          See Sonder.fm in Action
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-lg text-gray-600 dark:text-gray-300 text-center mb-12"
        >
          A glimpse of the beautiful, modern music experience
          you&apos;ll love.
        </motion.p>
        {/* Room Screenshot - full row */}
        <div className="flex justify-center w-full mb-16">
          <div className="w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{
                scale: 1.05,
                y: -12,
                rotate: 0.5,
              }}
              transition={{
                duration: 0.7,
                type: 'spring',
                stiffness: 120,
                damping: 15,
              }}
              viewport={{ once: true }}
              className="relative rounded-3xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden w-full mx-auto group cursor-pointer backdrop-blur-sm"
              style={{ aspectRatio: '16/10' }}
            >
              {/* Screenshot container */}
              <div className="relative w-full h-full">
                <Image
                  src="/room_desktop.png"
                  alt="Sonder.fm Room - Listen Together"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                  priority={true}
                  draggable={false}
                />
              </div>

              {/* Enhanced label overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <h3 className="text-white font-bold text-xl mb-3 tracking-wide">
                    Room - Listen Together
                  </h3>
                  <p className="text-gray-200 text-sm mb-3 opacity-90">
                    Real-time music rooms for shared listening
                    experiences
                  </p>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '80px' }}
                    transition={{
                      delay: 0.5,
                      duration: 0.8,
                      ease: 'easeOut',
                    }}
                    className="h-1 bg-gradient-to-r from-purple-400 to-pink-500 mx-auto rounded-full"
                  />
                </motion.div>
              </div>

              {/* Subtle gradient overlay for depth */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-white/10 dark:from-black/40 dark:to-white/5" />

              {/* Enhanced hover border effect */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 border-2 border-purple-400/60 rounded-3xl shadow-xl shadow-purple-400/20" />

              {/* Premium shine effect on hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-700 rounded-3xl"
                style={{
                  background: `linear-gradient(120deg, transparent, rgba(168, 85, 247, 0.4), transparent)`,
                  transform: 'translateX(-100%) skewX(-15deg)',
                }}
                whileHover={{
                  transform: 'translateX(150%) skewX(-15deg)',
                  transition: {
                    duration: 1.2,
                    ease: 'easeInOut',
                  },
                }}
              />

              {/* Corner accent with pulse effect */}
              <motion.div
                className="absolute top-4 right-4 w-3 h-3 bg-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Featured badge */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white text-xs font-bold rounded-full backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                Featured
              </div>
            </motion.div>
          </div>
        </div>
        {/* Other Desktop Screenshots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 px-4 md:px-0">
          {desktopScreens
            .filter((src) => src !== '/room_desktop.png')
            .map((src, i) => {
              const isJamDesktop = src.includes('jam_desktop');
              const isExportDesktop = src.includes('export_desktop');

              // Get descriptive labels
              let label = '';
              if (isJamDesktop) label = 'Music Jam Session';
              else if (isExportDesktop) label = 'Export to Spotify';

              return (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, y: 40, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{
                    scale: 1.05,
                    y: -12,
                    rotate: i % 2 === 0 ? 1 : -1,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.1 * i,
                    type: 'spring',
                    stiffness: 120,
                    damping: 15,
                  }}
                  viewport={{ once: true }}
                  className="relative rounded-3xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden w-full group cursor-pointer backdrop-blur-sm"
                  style={{ aspectRatio: '16/10' }}
                >
                  {/* Screenshot container */}
                  <div className="relative w-full h-full">
                    <Image
                      src={src}
                      alt={`Sonder.fm ${label} screenshot`}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                      draggable={false}
                    />
                  </div>

                  {/* Enhanced label overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="text-center"
                    >
                      <h3 className="text-white font-bold text-lg mb-2 tracking-wide">
                        {label}
                      </h3>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '60px' }}
                        transition={{
                          delay: 0.5 + i * 0.1,
                          duration: 0.8,
                          ease: 'easeOut',
                        }}
                        className="h-1 bg-gradient-to-r from-purple-400 to-pink-500 mx-auto rounded-full"
                      />
                    </motion.div>
                  </div>

                  {/* Subtle gradient overlay for depth */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-white/10 dark:from-black/40 dark:to-white/5" />

                  {/* Enhanced hover border effect */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 border-2 border-purple-400/60 rounded-3xl shadow-xl shadow-purple-400/20" />

                  {/* Premium shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-700 rounded-3xl"
                    style={{
                      background: `linear-gradient(120deg, transparent, rgba(168, 85, 247, 0.4), transparent)`,
                      transform: 'translateX(-100%) skewX(-15deg)',
                    }}
                    whileHover={{
                      transform: 'translateX(150%) skewX(-15deg)',
                      transition: {
                        duration: 1.2,
                        ease: 'easeInOut',
                      },
                    }}
                  />

                  {/* Corner accent */}
                  <div className="absolute top-4 right-4 w-3 h-3 bg-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              );
            })}
        </div>
        {/* Mobile Screenshots */}
        <div className="overflow-x-auto pt-8">
          {/* Desktop layout - horizontal row */}
          <div className="hidden md:flex gap-8 md:gap-10 justify-center items-start min-w-[500px] md:min-w-0">
            {mobileScreens.map((src, i) => {
              // Hide tracks_mobile.jpg on mobile
              const isTracksMobile = src.includes('tracks_mobile');
              if (isTracksMobile) {
                return (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{
                      scale: 1.05,
                      rotate: i % 2 === 0 ? -2 : 2,
                    }}
                    transition={{
                      duration: 0.7,
                      delay: 0.1 * i,
                      type: 'spring',
                      stiffness: 120,
                    }}
                    viewport={{ once: true }}
                    className="relative rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden max-w-[260px] w-full group"
                    style={{ aspectRatio: '9/19.5', height: '420px' }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '420px',
                      }}
                    >
                      <Image
                        src={src}
                        alt={`Sonder.fm mobile screenshot ${i + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 500px) 100vw, 500px"
                        draggable={false}
                      />
                    </div>
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-white/10 dark:from-black/30 dark:to-white/0" />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, y: 40, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{
                    scale: 1.05,
                    rotate: i % 2 === 0 ? -2 : 2,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.1 * i,
                    type: 'spring',
                    stiffness: 120,
                  }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden max-w-[260px] w-full group"
                  style={{ aspectRatio: '9/19.5', height: '420px' }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '420px',
                    }}
                  >
                    <Image
                      src={src}
                      alt={`Sonder.fm mobile screenshot ${i + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 500px) 100vw, 500px"
                      draggable={false}
                    />
                  </div>
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-white/10 dark:from-black/30 dark:to-white/0" />
                </motion.div>
              );
            })}
          </div>

          {/* Mobile layout - fanned out card spread */}
          <div className="md:hidden relative h-96 flex items-center justify-center">
            {mobileScreens.map((src, i) => {
              const isProfileMobile = src.includes('profile_mobile');
              const isBookmarksMobile = src.includes(
                'bookmarks_mobile'
              );
              const isTracksMobile = src.includes('tracks_mobile');

              let label = '';
              if (isProfileMobile) label = 'Profile';
              else if (isBookmarksMobile) label = 'Bookmarks';
              else if (isTracksMobile) label = 'Tracks';

              // Fan out positions and rotations
              const rotations = [-15, 0, 15]; // Degrees of rotation for each card
              const xOffsets = [-60, 0, 60]; // Horizontal offset in pixels
              const yOffsets = [20, 0, 20]; // Vertical offset for slight arc

              return (
                <motion.div
                  key={src}
                  initial={{
                    opacity: 0,
                    y: 100,
                    scale: 0.8,
                    rotate: rotations[i] * 2,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: yOffsets[i],
                    x: xOffsets[i],
                    scale: 1,
                    rotate: rotations[i],
                  }}
                  whileHover={{
                    scale: 1.1,
                    y: yOffsets[i] - 20,
                    x: xOffsets[i],
                    rotate: rotations[i] * 0.5,
                    zIndex: 50,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 * i,
                    type: 'spring',
                    stiffness: 100,
                    damping: 25,
                  }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="absolute"
                  style={{
                    zIndex: i + 1,
                  }}
                >
                  <motion.div
                    className="relative rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden w-[180px] group backdrop-blur-sm cursor-pointer transform-gpu"
                    style={{
                      aspectRatio: '9/19.5',
                      height: '320px',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '320px',
                      }}
                    >
                      <Image
                        src={src}
                        alt={`Sonder.fm ${label} mobile screenshot`}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 500px) 100vw, 500px"
                        draggable={false}
                      />
                    </div>

                    {/* Enhanced label overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="text-white font-bold text-sm text-center tracking-wide"
                      >
                        {label}
                      </motion.p>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{
                          delay: 0.7 + i * 0.1,
                          duration: 0.6,
                        }}
                        className="h-0.5 bg-purple-400 mx-auto mt-2 rounded-full"
                        style={{ maxWidth: '50px' }}
                      />
                    </div>

                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-white/20 dark:from-black/40 dark:to-white/10" />

                    {/* Enhanced hover border effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 border-2 border-purple-400/80 rounded-2xl shadow-lg shadow-purple-400/30" />

                    {/* Dynamic shine effect */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700"
                      style={{
                        background: `linear-gradient(45deg, transparent, rgba(168, 85, 247, 0.3), transparent)`,
                        transform: 'translateX(-100%)',
                      }}
                      whileHover={{
                        transform: 'translateX(100%)',
                        transition: {
                          duration: 0.8,
                          ease: 'easeInOut',
                        },
                      }}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePageContent() {
  const { user, login, loading } = useAuth();
  console.log(user);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const referrer = searchParams.get('ref');

  // Dummy line chart data
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Vibe Score',
        data: [12, 19, 3, 5, 2, 3, 9],
        borderColor: 'rgba(168, 85, 247, 0.7)',
        backgroundColor: 'rgba(168, 85, 247, 0.10)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(168, 85, 247, 0.7)',
        pointBorderColor: 'rgba(168, 85, 247, 0.3)',
        fill: true,
      },
      {
        label: 'Friends',
        data: [8, 11, 7, 10, 6, 8, 13],
        borderColor: 'rgba(236, 72, 153, 0.6)',
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(236, 72, 153, 0.6)',
        pointBorderColor: 'rgba(236, 72, 153, 0.2)',
        fill: true,
      },
      {
        label: 'Discovery',
        data: [5, 7, 6, 8, 4, 5, 10],
        borderColor: 'rgba(139, 92, 246, 0.5)',
        backgroundColor: 'rgba(139, 92, 246, 0.07)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(139, 92, 246, 0.5)',
        pointBorderColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
      },
    ],
  };
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: theme === 'dark' ? '#fff' : '#222',
          font: { size: 14, weight: 700 },
        },
      },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: theme === 'dark' ? '#fff' : '#222' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: theme === 'dark' ? '#fff' : '#222' },
      },
    },
  };

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
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
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
                className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 text-base font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/saalikmubeen/sonder.fm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 text-base font-medium transition-colors"
            >
              GitHub
            </a>
          </div>
          {/* Auth/CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 transition-colors"
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
              aria-label="Toggle theme"
            >
              <Moon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 transition-colors"
              onClick={handleLogin}
            >
              <LogIn className="w-4 h-4 mr-2" /> Log in
            </Button>
          </div>
          {/* Hamburger (Mobile) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <a
                  href="https://github.com/saalikmubeen/sonder.fm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-base font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  GitHub
                </a>
                <hr className="my-2 border-gray-200 dark:border-gray-800" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2"
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
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-5 py-1.5 mb-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
              Modern Music Social
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
              Connect. Share.{' '}
              <span className="text-purple-600 dark:text-purple-400">
                Vibe.
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 mb-10">
              Sonder.fm is the new way to showcase your music taste,
              discover new sounds, and connect with friends—all in a
              beautiful, modern experience.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-4">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 text-lg shadow rounded-full transition-all duration-200 hover:scale-105 hover:shadow-2xl"
              >
                Connect Spotify
              </Button>
              <Link
                href="/jam/discover"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 rounded-full font-semibold text-lg shadow transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 hover:shadow-2xl"
                style={{
                  minHeight: '56px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Radio className="w-4 h-4" />
                Discover Rooms
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Waitlist Section */}
      <WaitlistSection referrer={referrer || undefined} />
      {/* Screenshots Section */}
      <ScreenshotsSection />
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
              icon={<ArrowRight className="w-7 h-7" />}
              title="Modern, Social & Fun"
              description="A beautiful, modern experience designed for music lovers and social discovery."
              delay={0.1}
            />

            <FeatureCard
              icon={<Sparkles className="w-7 h-7" />}
              title="Personalized Feed"
              description="See what your friends are listening to and discover new music tailored to your taste."
              delay={0.2}
            />
            <FeatureCard
              icon={<Users className="w-7 h-7" />}
              title="Social Profiles"
              description="Showcase your top tracks, artists, and playlists in a beautiful profile."
              delay={0.3}
            />
            <FeatureCard
              icon={<Music className="w-7 h-7" />}
              title="Live Now Playing"
              description="Share your current vibe in real time with a live now playing status."
              delay={0.4}
            />
            <FeatureCard
              icon={<Heart className="w-7 h-7" />}
              title="Reactions & Vibe Notes"
              description="React to friends' music and leave vibe notes to share your thoughts."
              delay={0.5}
            />
            <FeatureCard
              icon={<Bookmark className="w-7 h-7" />}
              title="Bookmarks"
              description="Save your favorite moments in songs and revisit them anytime."
              delay={0.6}
            />
            <FeatureCard
              icon={<Radio className="w-7 h-7" />}
              title="Listening Rooms"
              description="Join or create real-time listening rooms to vibe together with friends."
              delay={0.7}
            />

            <FeatureCard
              icon={<List className="w-7 h-7" />}
              title="Room History & Export"
              description="View your listening history in rooms and export playlists to Spotify with one click."
              delay={0.8}
            />
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center mb-12"
            >
              Lead your music journey
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: 'easeOut',
              }}
              viewport={{ once: true }}
              className="rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl p-0 flex flex-col items-center gap-4 backdrop-blur-lg min-h-[350px]"
              whileHover={{
                scale: 1.07,
                y: -8,
                boxShadow: '0 8px 32px 0 rgba(168,85,247,0.18)',
              }}
            >
              <div className="w-full h-[350px] flex items-center justify-center">
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        labels: {
                          color: theme === 'dark' ? '#fff' : '#222',
                          font: { size: 16, weight: 700 },
                          boxWidth: 18,
                          boxHeight: 18,
                          padding: 24,
                        },
                      },
                      title: { display: false },
                      tooltip: {
                        backgroundColor:
                          theme === 'dark' ? '#222' : '#fff',
                        titleColor:
                          theme === 'dark' ? '#fff' : '#222',
                        bodyColor: theme === 'dark' ? '#fff' : '#222',
                        borderColor:
                          theme === 'dark' ? '#333' : '#eee',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                      },
                    },
                    layout: {
                      padding: 0,
                    },
                    elements: {
                      line: {
                        borderWidth: 2.5,
                        borderJoinStyle: 'round',
                      },
                      point: {
                        radius: 5,
                        hoverRadius: 8,
                        borderWidth: 2,
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          color: theme === 'dark' ? '#aaa' : '#444',
                          font: { size: 15, weight: 600 },
                          padding: 10,
                        },
                      },
                      y: {
                        grid: { display: false },
                        ticks: { display: false },
                      },
                    },
                  }}
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
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
              className="hover:text-purple-600 dark:hover:text-purple-400"
            >
              Features
            </a>
            <a
              href="#how"
              className="hover:text-purple-600 dark:hover:text-purple-400"
            >
              How it Works
            </a>
            <a
              href="https://github.com/saalikmubeen/sonder.fm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-600 dark:hover:text-purple-400"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      whileHover={{
        scale: 1.07,
        y: -8,
        boxShadow: '0 8px 32px 0 rgba(168,85,247,0.18)',
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow p-8 flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-2xl group cursor-pointer overflow-hidden hover:bg-gradient-to-br hover:from-white/80 hover:to-purple-100/60 dark:hover:from-purple-900/40 dark:hover:to-pink-900/30"
    >
      <motion.div
        whileHover={{ scale: 1.18, rotate: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg"
      >
        {icon}
      </motion.div>
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.07,
        y: -8,
        boxShadow: '0 8px 32px 0 rgba(168,85,247,0.18)',
      }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow p-6 flex flex-col items-center gap-2 text-center transition-all duration-300 hover:shadow-2xl group cursor-pointer overflow-hidden hover:bg-gradient-to-br hover:from-white/80 hover:to-purple-100/60 dark:hover:from-purple-900/40 dark:hover:to-pink-900/30"
    >
      <motion.div
        whileHover={{ scale: 1.18, rotate: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-lg mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg"
      >
        {number}
      </motion.div>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h4>
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        {description}
      </p>
    </motion.div>
  );
}
