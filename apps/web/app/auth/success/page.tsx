'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Get token and slug from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const slug = params.get('slug');

    if (token && slug) {
      localStorage.setItem('sonder_token', token);
      // Clean up the URL
      window.history.replaceState({}, document.title, '/');
      // Redirect to user profile
      router.replace(`/u/${slug}`);
    } else {
      // If missing, redirect to home
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Logging you in...</div>
    </div>
  );
}