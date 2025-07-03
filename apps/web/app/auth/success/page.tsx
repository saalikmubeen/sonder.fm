'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Get token and slug from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const slug = params.get('slug');

    if (token && slug) {
      localStorage.setItem('sonder_token', token);
      if (refreshToken) {
        localStorage.setItem('sonder_refresh_token', refreshToken);
      }
      // Redirect to user profile
      router.replace(`/u/${slug}`);
    } else {
      // If missing, redirect to home
      router.replace('/');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Logging you in...</div>
    </div>
  );
}