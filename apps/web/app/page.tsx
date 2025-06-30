'use client';

import { motion } from 'framer-motion';
import { Music, Heart, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@sonder/ui';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mb-8"
              >
                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                  <span className="gradient-text">Show the world</span>
                  <br />
                  <span className="text-gray-900 dark:text-white">
                    what your heart sounds like
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Sonder.fm is where your musical soul lives. Share your sound,
                  discover kindred spirits, and let the world feel what moves you.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              >
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-4 text-lg"
                >
                  <Music className="w-5 h-5 mr-2" />
                  Connect with Spotify
                </Button>
                <Link href="/explore">
                  <Button variant="ghost" size="lg" className="text-lg">
                    Explore Profiles
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
              >
                <FeatureCard
                  icon={<Heart className="w-8 h-8" />}
                  title="Musical Identity"
                  description="Get AI-powered poetic summaries of your musical vibe that capture the essence of your sound"
                  gradient="from-pink-500 to-rose-500"
                />
                <FeatureCard
                  icon={<Users className="w-8 h-8" />}
                  title="Connect Souls"
                  description="Find people who feel music the way you do and share your musical journey together"
                  gradient="from-blue-500 to-indigo-500"
                />
                <FeatureCard
                  icon={<Sparkles className="w-8 h-8" />}
                  title="Express Freely"
                  description="Leave anonymous vibe notes, react with emotions, and create your aesthetic profile"
                  gradient="from-purple-500 to-pink-500"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10 blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-10 blur-xl"
        />
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              Your Musical Story, Beautifully Told
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Every song tells a story. Every playlist reveals a mood.
              Let us help you share what makes your heart beat.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard
              number="01"
              title="Connect"
              description="Link your Spotify account securely"
              delay={0.1}
            />
            <StepCard
              number="02"
              title="Discover"
              description="Get your unique musical vibe summary"
              delay={0.2}
            />
            <StepCard
              number="03"
              title="Customize"
              description="Choose your aesthetic theme"
              delay={0.3}
            />
            <StepCard
              number="04"
              title="Share"
              description="Connect with kindred musical spirits"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold gradient-text mb-4">
                Sonder.fm
              </h3>
              <p className="text-gray-400 mb-8">
                Where musical souls connect and stories unfold
              </p>
              <div className="border-t border-gray-800 pt-8">
                <p className="text-gray-500 text-sm">
                  © 2024 Sonder.fm. Built for music lovers, by music lovers.
                </p>
              </div>
            </motion.div>
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
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass p-8 rounded-2xl text-center group"
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  description,
  delay
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
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-6">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </motion.div>
  );
}


