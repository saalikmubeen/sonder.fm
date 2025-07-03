import axios from 'axios';
import type { APIResponse } from '@sonder/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Only add interceptors on the client
if (typeof window !== 'undefined') {
  // Add auth token to requests
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sonder_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle auth errors with silent refresh
  let isRefreshing = false;
  let failedQueue: any[] = [];


  // When the refresh finishes (success or failure), processQueue is called with refreshTokenError or accessToken
  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        // If refresh failed, all are rejected with the error.
        prom.reject(error);
      } else {
        // If refresh succeeded, all queued requests’ Promises are resolved with the new token.
        prom.resolve(token);
      }
    });

    // The queue is cleared.
    failedQueue = [];
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If a response is a 401 and the request hasn’t already been retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        const refreshToken = localStorage.getItem('sonder_refresh_token');

        // The first request that gets a 401 and finds a refresh token, and isRefreshing is false, triggers the refresh.
        if (refreshToken && !isRefreshing) { // This runs for the first request that encounters 401
          console.log('[Auth] Starting token refresh...');
          originalRequest._retry = true;

          // isRefreshing is set to true so no other refreshes start. We only want any one request to refresh the access token.
          isRefreshing = true;
          try {
            const res = await axios.post(
              `${API_URL}/auth/refresh`,
              { refreshToken },
              { withCredentials: true }
            );
            const { accessToken, refreshToken: newRefreshToken } = res.data;
            localStorage.setItem('sonder_token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('sonder_refresh_token', newRefreshToken);
              console.log('[Auth] Received new refresh token.');
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;


            // All queued requests that failed due to expired access token are resolved with the new token (processQueue).
            processQueue(null, accessToken);
            isRefreshing = false;
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            console.log('[Auth] Token refresh successful. Retrying original request.');

            // The original request is retried with the new token.
            return api(originalRequest);
          } catch (refreshError) {
            // If fetching new access token fails:
            // All queued requests are rejected.
            // User is logged out.
            console.error('[Auth] Token refresh failed:', refreshError);
            processQueue(refreshError, null);
            localStorage.removeItem('sonder_token');
            localStorage.removeItem('sonder_refresh_token');
            window.location.href = '/';
            isRefreshing = false;
            return Promise.reject(refreshError);
          }
        }
        // This runs for the subsequent  request that encounters 401 during the similar time frame.
        else if (isRefreshing) { // Other requests that get 401 while refresh is in progress are
          // Queue requests while refreshing
          // If another request gets a 401 while isRefreshing is true, it does not trigger another refresh.
          // Instead, it creates a new Promise and pushes its resolve and reject functions to failedQueue.
          // This request is “paused” until the refresh finishes.
          console.log('[Auth] Token refresh in progress. Queuing request.');
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              // Queued requests are retried
              if (typeof token === 'string') {
                console.log('[Auth] Retrying request after token refresh.');
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                // When the Promise for a queued request is resolved (with the new token) in the processQueue function, the request is retried with the new Authorization header.
                console.log("[Auth] Token refresh successful. Retrying subsequent requests...")
                return api(originalRequest);
              } else {
                // If rejected, the request fails and the user is logged out.
                return Promise.reject(new Error('Token refresh failed'));
              }
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }
        // If no refresh token, log out
        console.warn('[Auth] No refresh token found. Logging out.');
        localStorage.removeItem('sonder_token');
        localStorage.removeItem('sonder_refresh_token');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );
}

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

export const userApi = {
  getMe: async () => {
    const response = await api.get('/user/me');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/user/me/stats');
    return response.data;
  },

  updateProfile: async (data: { displayName?: string; vibeSummary?: string }) => {
    const response = await api.put('/user/me', data);
    return response.data;
  },

  refreshNowPlaying: async () => {
    const response = await api.post('/user/me/refresh');
    return response.data;
  },

  search: async (query: string, limit: number = 10) => {
    const response = await api.get(`/user/search?q=${encodeURIComponent(query)}&limit=${limit}`);
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

  getReactions: async (slug: string) => {
    const response = await api.get(`/reaction/${slug}`);
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

  getMyNotes: async () => {
    const response = await api.get('/note/my/notes');
    return response.data;
  },

  deleteNote: async (noteId: string) => {
    const response = await api.delete(`/note/${noteId}`);
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

  getFollowStatus: async (slug: string) => {
    const response = await api.get(`/follow/${slug}/status`);
    return response.data;
  },
};

export const feedApi = {
  getFeed: async () => {
    const response = await api.get('/feed');
    return response.data;
  },

  getDiscover: async (limit: number = 10) => {
    const response = await api.get(`/feed/discover?limit=${limit}`);
    return response.data;
  },

  getTrending: async (limit: number = 10) => {
    const response = await api.get(`/feed/trending?limit=${limit}`);
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

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/message/${messageId}`);
    return response.data;
  },
};

export const bookmarkApi = {
  createBookmark: async (data: {
    trackId: string;
    timestampMs: number;
    caption?: string;
    metadata: {
      name: string;
      artists: {  name: string }[];
      album: { name: string; imageUrl: string };
      spotifyUrl: string;
    };
  }) => {
    const response = await api.post('/bookmark', data);
    return response.data;
  },

  getBookmarksForUser: async (slug: string, limit: number = 20, offset: number = 0) => {
    const response = await api.get(`/bookmark/${slug}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getMyBookmarks: async (limit: number = 20, offset: number = 0) => {
    const response = await api.get(`/bookmark/my/bookmarks?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  updateBookmark: async (bookmarkId: string, caption: string) => {
    const response = await api.put(`/bookmark/${bookmarkId}`, { caption });
    return response.data;
  },

  deleteBookmark: async (bookmarkId: string) => {
    const response = await api.delete(`/bookmark/${bookmarkId}`);
    return response.data;
  },
};