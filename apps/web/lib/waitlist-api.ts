import { apiClient } from './api';

export const waitlistApi = {
  // Join waitlist
  join: async (data: {
    email: string;
    name?: string;
    referrer?: string;
  }) => {
    const response = await apiClient.post('/waitlist', data);
    return response.data;
  },

  // Get waitlist count
  getCount: async () => {
    const response = await apiClient.get('/waitlist/count');
    return response.data;
  },

  // Get referral stats
  getReferralStats: async (code: string) => {
    const response = await apiClient.get(`/waitlist/referrals/${code}`);
    return response.data;
  },

  // Admin: Export waitlist
  export: async () => {
    const response = await apiClient.get('/waitlist/export');
    return response.data;
  },

  // Admin: Update entry status
  updateStatus: async (id: string, status: 'pending' | 'invited' | 'joined') => {
    const response = await apiClient.patch(`/waitlist/${id}/status`, { status });
    return response.data;
  },
};