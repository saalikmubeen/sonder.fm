'use client'

import React, { useEffect } from 'react';
import { useSpotifyPlayer } from '@/lib/useSpotifyPlayer';
import { useJammingStore } from '@/lib/jamming-store';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const JammingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { player, deviceId, ready } = useSpotifyPlayer(user?.accessToken || null);
  const setSocket = useJammingStore(state => state.setSocket);

  useEffect(() => {
    if (!user) return;
    // Connect to the /jamming namespace
    const sonder_access_token = localStorage.getItem("sonder_token")
    const socket: Socket = io(`${BACKEND_URL}/jamming`, {
      auth: { token: sonder_access_token },
      transports: ['websocket'],
      autoConnect: true,
    });
    setSocket(socket);

    socket.on('connect', () => {
      console.log("Connected to jamming socket")
    });

    socket.on('connect_error', (error) => {
      console.error("Error connecting to jamming socket", error)
    });

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [user, setSocket]);

  // Optionally, transfer playback to web player when ready
  useEffect(() => {
    if (ready && deviceId && user?.accessToken) {
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
  }, [ready, deviceId, user?.accessToken]);

  return <>{children}</>;
};