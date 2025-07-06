import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useJammingStore } from './jamming-store';

export function useJammingSocket(roomId: string, setRoom: (room: any) => void) {
  const socket = useJammingStore(state => state.socket);
  const player = useJammingStore(state => state.player);
  const deviceId = useJammingStore(state => state.deviceId);

  // Join room on mount, leave on unmount
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join_room', roomId);
    }
    return () => {
      if (socket && roomId) {
        socket.emit('leave_room', roomId);
      }
    };
  }, [socket, roomId]);

  // Handle playback events
  useEffect(() => {
    if (!socket) return;

    // User joined event
    const handleUserJoined = (user: any) => {
      setRoom((prev: any) => ({
        ...prev,
        members: [...(prev?.members || []), user],
      }));
      toast.success(`${user.displayName} joined the room`);
    };

    // User left event
    const handleUserLeft = (user: any) => {
      setRoom((prev: any) => ({
        ...prev,
        members: (prev?.members || []).filter((m: any) => m.userId !== user.userId),
      }));
      toast(`${user.displayName} left the room`, { icon: '👋' });
    };

    // Room state event
    const handleRoomState = (room: any) => {
      console.log('[Jamming] Received room state event', room);
      setRoom(room);
    };

    // Room ended event
    const handleRoomEnded = () => {
      toast.error('Room has ended');
      // Redirect will be handled by the component
    };

    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('room_state', handleRoomState);
    socket.on('room_ended', handleRoomEnded);

    if (!socket || !player || !deviceId) {
      toast.error('You don\'t have a spotify account connected or don\'t have a premium account');
      return;
    }

    const handlePlay = ({ trackId, positionMs }: { trackId: string; positionMs: number }) => {
      if (!player || !deviceId) return;
      console.log("Playing track", trackId, positionMs)
      player._options.getOAuthToken((token: string) => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`],
            position_ms: positionMs,
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
        .then(res => {
          if (!res.ok) {
            res.text().then(text => console.error('Spotify play API error:', text));
          }
        })
        .catch(err => {
          console.error('Error calling Spotify play API:', err);
        });
      });
    };

    const handlePause = () => {
      console.log('[Jamming] Received playback_pause event');
      toast('⏸️ Playback paused', { icon: '⏸️' });
      player._options.getOAuthToken((token: string) => {
        fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      });
    };

    const handleSeek = ({ positionMs }: { positionMs: number }) => {
      player._options.getOAuthToken((token: string) => {
        fetch(`https://api.spotify.com/v1/me/player/seek?device_id=${deviceId}&position_ms=${positionMs}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      });
    };

    socket.on('playback_play', handlePlay);
    socket.on('playback_pause', handlePause);
    socket.on('playback_seek', handleSeek);

    return () => {
      socket.off('playback_play', handlePlay);
      socket.off('playback_pause', handlePause);
      socket.off('playback_seek', handleSeek);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('room_state', handleRoomState);
      socket.off('room_ended', handleRoomEnded);
    };
  }, [socket, player, deviceId, setRoom]);
}