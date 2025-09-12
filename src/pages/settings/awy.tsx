import React, { useMemo } from 'react';
import { Heart, Users, Video, Shield } from 'lucide-react';
import { useAwyPresence } from '@/hooks/useAwyPresence';

export default function AWYSettings() {
  const {
    userId,
    connections,
    presenceByUser,
    reloadConnections,
  } = useAwyPresence();

  const rows = useMemo(() => {
    if (!userId) return [];
    return connections.map(c => {
      const partnerId = c.student_id === userId ? c.loved_one_id : c.student_id;
      const pres = partnerId ? presenceByUser.get(partnerId) : undefined;
      const status: 'pending' | 'online' | 'offline' | 'busy' =
        !partnerId ? 'pending' : (pres?.status ?? 'offline');
      const online = status === 'online';
      return {
        id: c.id,
        label: c.relationship || 'Loved one',
        partnerId: partnerId ?? null,
        status,
        online,
      };
    });
  }, [userId, connections, presenceByUser]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
              <Heart size={24} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Always With You</h1>
              <p className="text-gray-600">Manage your loved ones and video calling</p>
            </div>
          </div>
        </div>

        {/* Built-in Video Calling Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Video size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Built-in Video Calling</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Add loved ones by email in the purple AWY widget</li>
                  <li>• When they sign in with Google, the link activates automatically</li>
                  <li>• You’ll see their online status in real time</li>
                  <li>• Click the video icon to start a call</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Shield size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Privacy & Security</h2>
              <div className="space-y-3 text-gray-600">
                <p>• End-to-end encrypted calls</p>
                <p>• No call recordings stored on our servers</p>
                <p>• Only you and your loved ones can see presence</p>
                <p>• You control who can link to you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Loved Ones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users size={24} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Connected Loved Ones</h2>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-8">
              <Heart size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No loved ones linked yet</p>
              <p className="text-gray-500 text-sm">
                Use the floating heart widget to add and manage your loved ones.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(r => (
                <div key={r.id} className="flex items-center justify-between border rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Heart size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{r.label}</div>
                      <div className="text-xs">
                        {r.status === 'pending' ? (
                          <span className="text-amber-600">Pending — they can sign in with Google to activate</span>
                        ) : r.online ? (
                          <span className="text-green-600">● Online</span>
                        ) : (
                          <span className="text-gray-500">○ Offline</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => reloadConnections()}
                    className="text-sm text-gray-600 hover:text-gray-900"
                    title="Refresh"
                  >
                    Refresh
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
