'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { User, APIResponse } from '@sonder/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('sonder_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get<APIResponse<{ user: User }>>(
        `${API_URL}/auth/verify`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data) {
        setUser(response.data.data.user);
      } else {
        localStorage.removeItem('sonder_token');
      }
    } catch (error) {
      localStorage.removeItem('sonder_token');
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const response = await axios.get<APIResponse<{ authUrl: string }>>(
        `${API_URL}/auth/login`
      );


      if (response.data.success && response.data.data) {
        window.location.href = response.data.data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Failed to start login process');
    }
  };

  const logout = () => {
    localStorage.removeItem('sonder_token');
    setUser(null);
    router.push('/');
    toast.success('Logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  // Handle auth success from URL params (after Spotify redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const slug = urlParams.get('slug');

    if (token && slug) {
      localStorage.setItem('sonder_token', token);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Check auth to get user data
      checkAuth();
      toast.success('Welcome to Sonder.fm! 🎵');
      router.push(`/u/${slug}`);
    }
  }, [router]);

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}