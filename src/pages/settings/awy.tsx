import React, { useMemo } from 'react';
import { Heart, Users, Video, Shield, Trash2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAwyPresence } from '@/hooks/useAwyPresence';

export default function AWYSettings() {
  const supabase = getSupabaseClient();
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
      const online = pres?.status === 'online';
      return {
        id: c.id,
        relationship: c.relationship || 'Loved one',
        status: c.status,
        partnerId,
        online,
      };
    });
  }, [connections, presenceByUser, userId]);

  const removeConnection = async (id: string, label: string) => {
    if (!supabase) return;
    const ok = window.confirm(`Remove "${label}"?`);
    if (!ok) return;
    const { error } = await supabase.from('awy_connections').delete().eq('id', id);
    if (error) {
      alert(`Failed to remove: ${error.message}`);
      return;
    }
    reloadConnections();
  };

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
              <p className="text-gray-600">Manage your loved ones and video calling preferences</p>
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
                  <li>• They sign in with Google; activation happens automatically</li>
                  <li>• Presence shows in real time; click the video icon to call</li>
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
                <p>• No call recordings on our servers</p>
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

          {!userId ? (
            <div className="text-center py-8">
              <Heart size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Please sign in to view your AWY connections.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8">
              <Heart size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No loved ones linked yet.</p>
              <p className="text-gray-500 text-sm">
                Use the floating heart widget on your dashboard to add and manage your loved ones.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                        <Heart size={18} className="text-purple-600" />
                      </div>
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          r.online ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{r.relationship}</div>
                      <div className="text-xs text-gray-600">
                        {r.status === 'active' ? 'Active' : 'Pending activation'}
                        {r.online ? ' • Online' : ' • Offline'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeConnection(r.id, r.relationship)}
                    className="p-2 rounded-full border bg-white text-gray-600 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 size={16} />
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
