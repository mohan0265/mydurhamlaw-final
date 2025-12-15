import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { fetchAuthed } from '@/lib/fetchAuthed';

interface StudentProfile {
  display_name?: string;
  user_role?: string;
}

interface StudentConnection {
  id: string;
  student_id: string;
  relationship: string;
  display_name?: string;
  student_profile?: StudentProfile;
}

interface PresenceData {
  status?: string;
  available?: boolean;
  lastSeen?: string;
}

export default function LovedOneDashboard() {
  const [connections, setConnections] = useState<StudentConnection[]>([]);
  const [presence, setPresence] = useState<Record<string, PresenceData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadPresence, 10000); // Update presence every 10s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [connectionsRes, presenceRes] = await Promise.all([
        fetchAuthed('/api/awy/connections'),
        fetchAuthed('/api/awy/presence')
      ]);

      const connectionsData = await connectionsRes.json();
      const presenceData = await presenceRes.json();

      setConnections(connectionsData.connections || []);
      setPresence(presenceData || {});
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPresence = async () => {
    try {
      const res = await fetchAuthed('/api/awy/presence');
      const data = await res.json();
      setPresence(data || {});
    } catch (error) {
      console.debug('Presence update failed:', error);
    }
  };

  const startCall = async (studentId: string) => {
    try {
      const res = await fetchAuthed('/api/awy/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: studentId })
      });

      const data = await res.json();
      if (data.roomUrl) {
        window.location.href = data.roomUrl;
      }
    } catch (error) {
      console.error('Call failed:', error);
      alert('Could not start call. Please try again.');
    }
  };

  const getDisplayName = (connection: StudentConnection): string => {
    return (
      connection.display_name || 
      connection.student_profile?.display_name || 
      'Your Student'
    );
  };

  const getInitial = (connection: StudentConnection): string => {
    const name = getDisplayName(connection);
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Always With You - Family Dashboard
          </h1>
          <p className="text-gray-600">
            Stay connected with your loved ones at Durham University
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Your Students</h2>
          
          {connections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No connections yet</p>
              <p className="text-sm text-gray-400">
                Ask your student to add you through their AWY settings
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection) => {
                const studentPresence = presence[connection.student_id] || {};
                const isOnline = studentPresence.status === 'online';
                const isAvailable = studentPresence.available === true;
                
                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                          <span className="text-violet-600 font-semibold">
                            {getInitial(connection)}
                          </span>
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {getDisplayName(connection)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {connection.relationship || 'Student'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isOnline ? (
                            isAvailable ? 'Available for calls' : 'Online but busy'
                          ) : (
                            studentPresence.lastSeen 
                              ? `Last seen ${new Date(studentPresence.lastSeen).toLocaleString()}`
                              : 'Last seen unknown'
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => startCall(connection.student_id)}
                      disabled={!isOnline || !isAvailable}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isOnline && isAvailable
                          ? 'bg-violet-600 text-white hover:bg-violet-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isOnline && isAvailable ? 'Call Now' : 'Unavailable'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
