import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { verifyAdminAccess } from '@/lib/access/verify';
import { useRouter } from 'next/router';

/**
 * Upgraded Admin Dashboard
 * 
 * Manages access_allowlist for Durham email gate
 * Features:
 * - View all allowlist entries
 * - Add new users (Durham emails)
 * - Edit trial dates
 * - Block/unblock users
 * - Admin role management
 */

interface AllowlistEntry {
  id: string;
  email: string;
  role: 'student' | 'admin';
  status: 'active' | 'blocked' | 'pending';
  trial_expires_at: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

interface Props {
  authorized: boolean;
  adminEmail?: string;
}

export default function AdminAccessControl({ authorized, adminEmail }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('active');
  
  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'admin'>('student');
  const [newTrialDays, setNewTrialDays] = useState('30');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (authorized) {
      fetchEntries();
    }
  }, [authorized]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/access/list', {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
      } else {
        console.error('Failed to fetch entries:', data);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch('/api/admin/access/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
          status: 'active',
          trial_days: newRole === 'student' ? parseInt(newTrialDays) : undefined,
          notes: `Added by ${adminEmail} on ${new Date().toISOString()}`
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewEmail('');
        setNewRole('student');
        setNewTrialDays('30');
        fetchEntries();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
    setAdding(false);
  };

  const handleBlockUser = async (email: string) => {
    if (!confirm(`Block access for ${email}?`)) return;

    try {
      const res = await fetch('/api/admin/access/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        fetchEntries();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  };

  const handleUnblock = async (email: string) => {
    try {
      const res = await fetch('/api/admin/access/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          status: 'active'
        })
      });

      if (res.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleExtendTrial = async (email: string, days: number) => {
    try {
      const res = await fetch('/api/admin/access/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          trial_days: days
        })
      });

      if (res.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error('Error extending trial:', error);
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    return entry.status === filter;
  });

  const getTrialStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { text: 'Full Access', class: 'text-green-600 bg-green-50' };
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: 'Expired', class: 'text-red-600 bg-red-50' };
    if (daysLeft < 7) return { text: `${daysLeft}d left`, class: 'text-orange-600 bg-orange-50' };
    return { text: `${daysLeft}d left`, class: 'text-blue-600 bg-blue-50' };
  };

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Access Control</h1>
              <p className="text-sm text-gray-600">Manage Durham student access & trials</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Admin: {adminEmail}</span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Exit Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'active' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Active ({entries.filter(e => e.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('blocked')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'blocked' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Blocked ({entries.filter(e => e.status === 'blocked').length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            + Add User
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No entries found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => {
                  const trialStatus = getTrialStatus(entry.trial_expires_at);
                  return (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${trialStatus.class}`}>
                          {trialStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {entry.status === 'active' && entry.role === 'student' && (
                            <>
                              <button
                                onClick={() => handleExtendTrial(entry.email, 30)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Extend trial 30 days"
                              >
                                +30d
                              </button>
                              <button
                                onClick={() => handleBlockUser(entry.email)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Block
                              </button>
                            </>
                          )}
                          {entry.status === 'blocked' && (
                            <button
                              onClick={() => handleUnblock(entry.email)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@durham.ac.uk"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Students must use @durham.ac.uk email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'student' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {newRole === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Days
                  </label>
                  <input
                    type="number"
                    value={newTrialDays}
                    onChange={(e) => setNewTrialDays(e.target.value)}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for full access (no expiry)
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  // Verify admin access using new system
  const { isAdmin, email } = await verifyAdminAccess(req, res);

  if (!isAdmin) {
    return {
      props: {
        authorized: false,
      },
    };
  }

  return {
    props: {
      authorized: true,
      adminEmail: email,
    },
  };
};
