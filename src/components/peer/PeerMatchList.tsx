
'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/lib/flags';
import { telemetry } from '@/lib/telemetry';
import { resilientFetch } from '@/lib/resilient-fetch';
import { Users, Search, Filter, Loader, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PeerProfileCard from './PeerProfileCard';

interface PeerProfile {
  user_id: string;
  display_name: string;
  bio?: string;
  tags: string[];
  availability: Record<string, any>;
  goals: string[];
  year: string;
  score: number;
  is_public: boolean;
  last_active: string;
  common_tags?: number;
}

interface ConnectionStatus {
  [userId: string]: 'none' | 'pending' | 'connected';
}

interface Props {
  currentUserId?: string;
  maxResults?: number;
  showFilters?: boolean;
  compactView?: boolean;
}

export default function PeerMatchList({ 
  currentUserId, 
  maxResults = 10, 
  showFilters = true, 
  compactView = false 
}: Props) {
  const isEnabled = useFeatureFlag('ff_peer_rooms');
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [filteredPeers, setFilteredPeers] = useState<PeerProfile[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEnabled) {
      fetchPeers();
      fetchConnectionStatuses();
    }
  }, [isEnabled, currentUserId]);

  useEffect(() => {
    applyFilters();
  }, [peers, searchQuery, yearFilter, tagFilter, availableOnly]);

  const fetchPeers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock API call - replace with actual Supabase query
      const response = await resilientFetch('/api/peers/match', {
        headers: {
          'x-user-id': currentUserId || 'current-user',
        },
        endpoint: 'peer-matching',
        showErrorToast: false,
      });

      const data = await response.json();
      
      if (data.success) {
        setPeers(data.peers || []);
      } else {
        // Mock data for demonstration
        const mockPeers: PeerProfile[] = [
          {
            user_id: 'user1',
            display_name: 'Sarah Chen',
            bio: '2nd year law student interested in human rights and international law.',
            tags: ['Human Rights', 'International Law', 'Mooting'],
            availability: { study_sessions: true, status: 'available' },
            goals: ['Master contract law', 'Join mooting competition', 'Improve legal writing'],
            year: 'year2',
            score: 4.2,
            is_public: true,
            last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            common_tags: 3,
          },
          {
            user_id: 'user2',
            display_name: 'Alex Johnson',
            bio: '3rd year student focusing on commercial law and corporate practice.',
            tags: ['Commercial Law', 'Corporate Law', 'Study Groups'],
            availability: { study_sessions: true, status: 'available' },
            goals: ['Ace finals', 'Find training contract', 'Build network'],
            year: 'year3',
            score: 4.5,
            is_public: true,
            last_active: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            common_tags: 2,
          },
          {
            user_id: 'user3',
            display_name: 'Emma Wilson',
            bio: '1st year looking for study partners and academic support.',
            tags: ['Contract Law', 'Tort Law', 'Study Partner'],
            availability: { study_sessions: false, status: 'busy' },
            goals: ['Understand legal basics', 'Join study group', 'Meet new people'],
            year: 'year1',
            score: 3.8,
            is_public: true,
            last_active: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            common_tags: 1,
          },
        ];
        setPeers(mockPeers);
      }
    } catch (error) {
      console.error('Failed to fetch peers:', error);
      setError('Unable to load peer matches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnectionStatuses = async () => {
    try {
      // Mock connection statuses
      const mockStatuses: ConnectionStatus = {
        user1: 'none',
        user2: 'pending',
        user3: 'connected',
      };
      setConnectionStatus(mockStatuses);
    } catch (error) {
      console.error('Failed to fetch connection statuses:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...peers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(peer => 
        peer.display_name.toLowerCase().includes(query) ||
        peer.bio?.toLowerCase().includes(query) ||
        peer.tags.some(tag => tag.toLowerCase().includes(query)) ||
        peer.goals.some(goal => goal.toLowerCase().includes(query))
      );
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(peer => peer.year === yearFilter);
    }

    // Tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(peer => 
        peer.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      );
    }

    // Availability filter
    if (availableOnly) {
      filtered = filtered.filter(peer => 
        peer.availability?.study_sessions === true || peer.availability?.status === 'available'
      );
    }

    // Sort by common tags and score
    filtered.sort((a, b) => {
      if (a.common_tags !== b.common_tags) {
        return (b.common_tags || 0) - (a.common_tags || 0);
      }
      return b.score - a.score;
    });

    // Limit results
    filtered = filtered.slice(0, maxResults);

    setFilteredPeers(filtered);
  };

  const handleConnect = async (userId: string) => {
    try {
      setIsConnecting(userId);

      const response = await resilientFetch('/api/peers/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId || 'current-user',
        },
        body: JSON.stringify({ target_user_id: userId }),
        endpoint: 'peer-connect',
      });

      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus(prev => ({
          ...prev,
          [userId]: 'pending',
        }));
        toast.success('Connection request sent!');
        telemetry.track('peer_connection_request', { target_user: userId });
      } else {
        throw new Error(result.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to send connection request');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleMessage = (userId: string) => {
    // TODO: Implement messaging system
    toast('Messaging system coming soon!', { icon: 'ℹ️' });
    telemetry.track('peer_message_attempt', { target_user: userId });
  };

  const getUniqueYears = () => {
    const years = Array.from(new Set(peers.map(peer => peer.year)));
    return years.sort();
  };

  const getUniqueTags = () => {
    const tags = Array.from(new Set(peers.flatMap(peer => peer.tags)));
    return tags.sort();
  };

  if (!isEnabled) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <div className="text-gray-600">Peer matching is not available</div>
        <div className="text-sm text-gray-500 mt-1">
          This feature is currently disabled
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Find Study Partners</h2>
              <p className="text-sm text-gray-600">Connect with fellow Durham Law students</p>
            </div>
          </div>
          <button
            onClick={fetchPeers}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, interests, or goals..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Filter Options */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>
                      {year === 'year1' ? '1st Year' : year === 'year2' ? '2nd Year' : year === 'year3' ? '3rd Year' : year}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Interests</option>
                {getUniqueTags().map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>Available for study</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <div className="text-gray-600 mb-2">{error}</div>
            <button
              onClick={fetchPeers}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPeers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <div className="text-gray-600 mb-2">No study partners found</div>
            <div className="text-sm text-gray-500">
              {searchQuery || yearFilter !== 'all' || tagFilter !== 'all' || availableOnly
                ? 'Try adjusting your filters or search terms'
                : 'Be the first to create a public profile!'
              }
            </div>
          </div>
        ) : (
          <div className={`space-y-${compactView ? '3' : '6'}`}>
            {filteredPeers.map((peer) => (
              <PeerProfileCard
                key={peer.user_id}
                profile={peer}
                onConnect={handleConnect}
                onMessage={handleMessage}
                isConnected={connectionStatus[peer.user_id] === 'connected'}
                isPending={connectionStatus[peer.user_id] === 'pending' || isConnecting === peer.user_id}
                showActions={peer.user_id !== currentUserId}
                compact={compactView}
              />
            ))}

            {filteredPeers.length === maxResults && peers.length > maxResults && (
              <div className="text-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Showing top {maxResults} matches
                </div>
                <button
                  onClick={() => {/* TODO: Implement load more */}}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View More Matches
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {!isLoading && !error && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredPeers.length} of {peers.length} available study partners
            </div>
            <div className="flex items-center space-x-4">
              <span>Connected: {Object.values(connectionStatus).filter(s => s === 'connected').length}</span>
              <span>Pending: {Object.values(connectionStatus).filter(s => s === 'pending').length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
