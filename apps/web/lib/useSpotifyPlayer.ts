import { useEffect } from 'react';
import { useJammingStore, type JammingState } from './jamming-store';
import { refreshSpotifyToken } from './api';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export function useSpotifyPlayer(accessToken: string | null) {
  const setPlayer = useJammingStore((state: JammingState) => state.setPlayer);
  const setDeviceId = useJammingStore((state: JammingState) => state.setDeviceId);
  const player = useJammingStore((state: JammingState) => state.player);
  const deviceId = useJammingStore((state: JammingState) => state.deviceId);
  const ready = useJammingStore((state: JammingState) => state.playerReady);
  const setReady = useJammingStore((state: JammingState) => state.setPlayerReady);

  useEffect(() => {
    if (!accessToken) return;

    // Only load SDK if not already loaded
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    let currentToken = accessToken;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Sonder.fm Web Player',
        getOAuthToken: async (cb: (token: string) => void) => {
          // Try the current token first
          cb(currentToken);
        },
        volume: 0.8,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setReady(true);
      });

      player.addListener('not_ready', () => {
        setReady(false);
      });

      // Listen for authentication errors and refresh token if needed
      player.addListener('authentication_error', async (e: any) => {
        try {
          const newToken = await refreshSpotifyToken();
          currentToken = newToken;
          // No need to call cb here; the SDK will call getOAuthToken again as needed
        } catch (err) {
          // Optionally, handle logout or error UI
          console.error('Failed to refresh Spotify token', err);
        }
      });

      player.connect();
      setPlayer(player);
    };

    return () => {
      if (player) player.disconnect();
    };
    // eslint-disable-next-line
  }, [accessToken]);

  return { player, deviceId, ready };
}