'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { User, APIResponse } from '@sonder/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from './api';

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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // React Query for user auth
  const {
    data: userData,
    isLoading,
    isError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['me'],
    queryFn: userApi.getMe,
    enabled: mounted && !!localStorage.getItem('sonder_token'),
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem('sonder_token');
    }
  }, [isError]);

  const user = (userData as any)?.data || null;
  const loading = isLoading;

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
    queryClient.removeQueries({ queryKey: ['me'] });
    router.push('/');
    toast.success('Logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      // Optimistically update user in cache
      queryClient.setQueryData(['me'], (old: any) => ({
        ...old,
        data: { ...old?.data, ...updates },
      }));
    }
  };

  const value = {
    user: user ? user.user : null,
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