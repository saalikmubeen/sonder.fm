'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Download,
  Search,
  Filter,
  Mail,
  User,
  Calendar,
  ExternalLink,
  CheckCircle,
  Clock,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { waitlistApi } from '@/lib/waitlist-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { timeAgo } from '@sonder/utils';

interface WaitlistEntry {
  _id: string;
  email: string;
  name?: string;
  referralCode: string;
  referredBy?: {
    email: string;
    name?: string;
    referralCode: string;
  };
  status: 'pending' | 'invited' | 'joined';
  position: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminWaitlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch waitlist entries
  const {
    data: waitlistData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-waitlist'],
    queryFn: waitlistApi.export,
    enabled: !!user,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'invited' | 'joined' }) =>
      waitlistApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const entries: WaitlistEntry[] = waitlistData?.data || [];

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.referralCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const csvContent = [
      ['Position', 'Email', 'Name', 'Status', 'Referral Code', 'Referred By', 'Created At'].join(','),
      ...filteredEntries.map(entry => [
        entry.position,
        entry.email,
        entry.name || '',
        entry.status,
        entry.referralCode,
        entry.referredBy?.email || '',
        new Date(entry.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonder-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'invited':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'joined':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'invited':
        return <Mail className="w-4 h-4" />;
      case 'joined':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Access Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to access the admin panel.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-medium hover:bg-purple-700 transition-colors"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-medium hover:bg-purple-700 transition-colors"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Waitlist Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage and export waitlist entries
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {entries.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Entries
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {entries.filter(e => e.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pending
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {entries.filter(e => e.status === 'invited').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Invited
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {entries.filter(e => e.status === 'joined').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Joined
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, name, or referral code..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-8 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="invited">Invited</option>
                <option value="joined">Joined</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Entries Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
              />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No entries found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No waitlist entries yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Referral
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Referred By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredEntries.map((entry, index) => (
                    <motion.tr
                      key={entry._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          #{entry.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.name || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {getStatusIcon(entry.status)}
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900 dark:text-white">
                          {entry.referralCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.referredBy ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.referredBy.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {entry.referredBy.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Direct</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {timeAgo(new Date(entry.createdAt))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={entry.status}
                          onChange={(e) => updateStatusMutation.mutate({
                            id: entry._id,
                            status: e.target.value as 'pending' | 'invited' | 'joined'
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="invited">Invited</option>
                          <option value="joined">Joined</option>
                        </select>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}