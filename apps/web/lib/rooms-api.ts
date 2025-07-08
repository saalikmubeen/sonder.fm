import { apiClient } from './api';

export const roomsApi = {
  // Get active rooms for discovery
  getDiscoveryRooms: async (filter?: 'all' | 'friends', search?: string, tags?: string[]) => {
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.append('filter', filter);
    if (search) params.append('search', search);
    if (tags && tags.length > 0) params.append('tags', tags.join(','));
    
    const queryString = params.toString();
    const response = await apiClient.get(`/rooms/discover${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  // Get recently ended rooms
  getRecentRooms: async (search?: string, tags?: string[]) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tags && tags.length > 0) params.append('tags', tags.join(','));
    
    const queryString = params.toString();
    const response = await apiClient.get(`/rooms/recent${queryString ? `?${queryString}` : ''}`);
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