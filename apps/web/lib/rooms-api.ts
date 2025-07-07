import { apiClient } from './api';

export const roomsApi = {
  // Get rooms for discovery
  getDiscoveryRooms: async (filter?: 'all' | 'friends') => {
    const params = filter ? `?filter=${filter}` : '';
    const response = await apiClient.get(`/rooms/discover${params}`);
    return response.data;
  },

  // Get room history
  getRoomHistory: async (roomId: string, limit: number = 50, offset: number = 0) => {
    const response = await apiClient.get(`/rooms/${roomId}/history?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Export room history to Spotify playlist
  exportPlaylist: async (roomId: string, name?: string, description?: string) => {
    const response = await apiClient.post(`/rooms/${roomId}/export-playlist`, {
      name,
      description,
    });
    return response.data;
  },

  // Get room details
  getRoomDetails: async (roomId: string) => {
    const response = await apiClient.get(`/rooms/${roomId}/details`);
    return response.data;
  },
};