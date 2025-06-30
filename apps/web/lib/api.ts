import axios from 'axios';
import type { APIResponse } from '@sonder/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sonder_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sonder_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const apiClient = api;

// API functions
export const profileApi = {
  getProfile: async (slug: string) => {
    const response = await api.get(`/profile/${slug}`);
    return response.data;
  },

  updateTheme: async (slug: string, theme: string) => {
    const response = await api.put(`/profile/${slug}/theme`, { theme });
    return response.data;
  },
};

export const reactionApi = {
  addReaction: async (slug: string, emoji: string) => {
    const response = await api.post(`/reaction/${slug}`, { emoji });
    return response.data;
  },

  removeReaction: async (slug: string, emoji: string) => {
    const response = await api.delete(`/reaction/${slug}`, {
      data: { emoji }
    });
    return response.data;
  },
};

export const noteApi = {
  addNote: async (slug: string, note: string, isAnonymous: boolean = true) => {
    const response = await api.post(`/note/${slug}`, { note, isAnonymous });
    return response.data;
  },

  getNotes: async (slug: string) => {
    const response = await api.get(`/note/${slug}`);
    return response.data;
  },
};

export const followApi = {
  follow: async (slug: string) => {
    const response = await api.post(`/follow/${slug}`);
    return response.data;
  },

  unfollow: async (slug: string) => {
    const response = await api.delete(`/follow/${slug}`);
    return response.data;
  },

  getFollowers: async (slug: string) => {
    const response = await api.get(`/follow/${slug}/followers`);
    return response.data;
  },

  getFollowing: async (slug: string) => {
    const response = await api.get(`/follow/${slug}/following`);
    return response.data;
  },
};

export const feedApi = {
  getFeed: async () => {
    const response = await api.get('/feed');
    return response.data;
  },
};

export const messageApi = {
  getConversations: async () => {
    const response = await api.get('/message/conversations');
    return response.data;
  },

  getMessages: async (userId: string) => {
    const response = await api.get(`/message/${userId}`);
    return response.data;
  },

  sendMessage: async (receiverId: string, content: string) => {
    const response = await api.post('/message', { receiverId, content });
    return response.data;
  },

  markAsRead: async (messageId: string) => {
    const response = await api.put(`/message/${messageId}/read`);
    return response.data;
  },
};