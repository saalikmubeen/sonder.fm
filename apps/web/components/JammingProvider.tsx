'use client'

import React, { useEffect } from 'react';
import { useSpotifyPlayer } from '@/lib/useSpotifyPlayer';
import { useJammingStore } from '@/lib/jamming-store';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Token refresh logic inspired by lib/api.ts
async function refreshSocketToken() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const refreshToken = localStorage.getItem('sonder_refresh_token');
  if (!refreshToken) throw new Error('No refresh token');
  const res = await axios.post(
    `${API_URL}/auth/refresh`,
    { refreshToken },
    { withCredentials: true }
  );
  const { accessToken, refreshToken: newRefreshToken } = res.data;
  localStorage.setItem('sonder_token', accessToken);
  if (newRefreshToken) {
    localStorage.setItem('sonder_refresh_token', newRefreshToken);
  }
  return accessToken;
}

export const JammingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { player, deviceId, ready } = useSpotifyPlayer(user?.accessToken || null);
  const setSocket = useJammingStore(state => state.setSocket);

  // Helper to get the current token from localStorage
  function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('sonder_token') : null;
  }

  // Reconnect socket when token changes
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;
    let socket: Socket | null = null;
    function connectSocket(token: string) {
      if (socket) {
        socket.disconnect();
      }
      socket = io(`${BACKEND_URL}/jamming`, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
      });
      setSocket(socket);
      socket.on('connect', () => {
        console.log('Connected to jamming socket');
      });
      socket.on('connect_error', async (error) => {
        console.error('Error connecting to jamming socket', error);
        // If error is auth, try to refresh token and reconnect
        if (error?.message?.toLowerCase().includes('auth') || error?.message?.toLowerCase().includes('jwt expired')) {
          console.log('Refreshing auth token on socket error........')
          try {
            const newToken = await refreshSocketToken();
            connectSocket(newToken);
          } catch (err) {
            // If refresh fails, log out user or redirect
            localStorage.removeItem('sonder_token');
            localStorage.removeItem('sonder_refresh_token');
            window.location.href = '/';
          }
        } else {
          // For other errors, try to reconnect with the latest token
          const newToken = getToken();
          if (newToken && newToken !== token) {
            connectSocket(newToken);
          }
        }
      });
    }
    connectSocket(token);
    // Listen for token changes in localStorage (e.g., after refresh)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sonder_token' && e.newValue && e.newValue !== token) {
        connectSocket(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      if (socket) socket.disconnect();
      setSocket(null);
      window.removeEventListener('storage', onStorage);
    };
  }, [user, setSocket]);

  // Optionally, transfer playback to web player when ready
  useEffect(() => {
    if (ready && deviceId) {
      // Always get the latest token from localStorage
      if (!user?.accessToken) return;
      console.log("Transferring playback to web player")
      fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });
    }
  }, [ready, deviceId]);

  return <>{children}</>;
};