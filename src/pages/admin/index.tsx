import { GetServerSideProps } from "next"
import { parse } from "cookie"
import { createHmac } from "crypto"
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin"
import { useState } from "react"

type AdminRow = {
  id: string
  user_id?: string
  email: string | null
  display_name: string | null
  user_role: string | null
  year_group: string | null
  trial_started_at: string | null
  trial_ends_at: string | null
  trial_ever_used: boolean | null
  is_test_account: boolean | null
  subscription_status: string | null
  subscription_ends_at: string | null
}

type AdminUser = {
  id: string
  email: string | null
  created_at: string | null
  last_sign_in_at: string | null
  provider: string | null
}

type AWYConn = {
  id: string
  studentId?: string
  lovedOneId?: string
  studentEmail: string
  lovedEmail: string
  relationship: string
  status: string
  createdAt: string
}

type Props = {
  authorized: boolean
  rows: AdminRow[]
  users: AdminUser[]
  connections: AWYConn[]
  requests: any[] // access_requests
  error?: string | null
}

const COOKIE_NAME = "admin_session"

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (!adminUser || !adminPass) return null
  return createHmac("sha256", adminPass).update(adminUser).digest("hex")
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const token = parse(ctx.req.headers.cookie || "")[COOKIE_NAME]
  const exp = expectedToken()
  if (!token || !exp || token !== exp) {
    return {
      redirect: { destination: "/admin/login", permanent: false },
      props: { authorized: false, rows: [], users: [], connections: [], requests: [], error: null }
    }
  }

  const adminClient = getSupabaseAdmin()
  if (!adminClient) {
    return {
      props: {
        authorized: true,
        rows: [],
        users: [],
        connections: [],
        requests: [],
        error: "Server misconfigured: missing Supabase admin env vars"
      }
    }
  }

  // Fetch profiles - only select columns that exist (NO user_id!)
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, display_name, user_role, year_of_study, year_group, trial_started_at, trial_ever_used")
    .order("created_at", { ascending: false })
    .limit(200)

  let users: AdminUser[] = []
  let connections: AWYConn[] = []
  let errMsg: string | null = null
  
  // Fetch new fields separately to handle gracefully if they don't exist
  let profilesWithNewFields: AdminRow[] = []
  
  if (data) {
    try {
      // Try to fetch new fields (is_test_account, subscription_status, etc.)
      const { data: extendedData } = await adminClient
        .from("profiles")
        .select("id, is_test_account, subscription_status, subscription_ends_at, trial_ends_at")
        .in('id', data.map(p => p.id))
      
      // Merge the data
      profilesWithNewFields = data.map((profile: any) => {
        const extended = extendedData?.find((e: any) => e.id === profile.id)
        return {
          ...profile,
          email: null, // Will be populated from auth users
          is_test_account: extended?.is_test_account ?? false,
          subscription_status: extended?.subscription_status ?? 'trial',
          subscription_ends_at: extended?.subscription_ends_at ?? null,
          trial_ends_at: extended?.trial_ends_at ?? null,
        }
      })
    } catch {
      // If new fields don't exist, use base data
      profilesWithNewFields = data.map((profile: any) => ({
        ...profile,
        email: null,
        is_test_account: false,
        subscription_status: 'trial',
        subscription_ends_at: null,
        trial_ends_at: null,
      }))
    }
  }

  try {
    const { data: list } = await adminClient.auth.admin.listUsers()
    users =
      list?.users?.map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        provider: u.app_metadata?.provider ?? null
      })) ?? []

    // Map emails to profiles (use id only, no user_id column exists)
    profilesWithNewFields = profilesWithNewFields.map(profile => {
      const authUser = users.find(u => u.id === profile.id)
      return {
        ...profile,
        user_id: profile.id, // Add user_id field = id for compatibility
        email: authUser?.email ?? null
      }
    })

    // Fetch AWY connections - use direct columns instead of FK joins
    const { data: conns, error: connsError } = await adminClient
      .from('awy_connections')
      .select(`
        id,
        student_id,
        student_user_id,
        loved_one_id,
        loved_user_id,
        loved_email,
        email,
        relationship,
        nickname,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (conns && !connsError) {
      connections = conns.map((c: any) => {
        // Use student_id or student_user_id
        const studentId = c.student_id || c.student_user_id
        const lovedId = c.loved_one_id || c.loved_user_id
        
        const studentEmail = users.find(u => u.id === studentId)?.email || '-'
        const lovedEmail = c.loved_email || c.email || users.find(u => u.id === lovedId)?.email || '-'
        return {
          id: c.id,
          studentId: studentId,
          lovedOneId: lovedId,
          studentEmail,
          lovedEmail,
          relationship: c.nickname || c.relationship || '-',
          status: c.status || '-',
          createdAt: c.created_at || '-'
        }
      })
    }
  } catch (e: any) {
    errMsg = e?.message || "Failed to load auth users"
  }

  // Fetch Pending Invitations
  try {
    const { data: invites } = await adminClient
      .from('student_invitations')
      .select('*')
      .eq('status', 'pending');
    
    if (invites) {
      const inviteRows: AdminRow[] = invites.map((inv: any) => ({
        id: `invite_${inv.id}`,
        user_id: undefined,
        email: inv.email,
        display_name: inv.display_name,
        user_role: 'student', // Default role
        year_group: inv.year_group,
        trial_started_at: null,
        trial_ends_at: null, // Could use inv.expires_at, but it's invite expiry not trial end
        trial_ever_used: false,
        is_test_account: false,
        subscription_status: 'invited', // Custom status
        subscription_ends_at: null,
      }));
      
      // Add invites to the TOP of the list
      profilesWithNewFields = [...inviteRows, ...profilesWithNewFields];
    }
  } catch (e) {
    console.error('Failed to load invites', e);
  }

  // Fetch Access Requests (Pending)
  let requests: any[] = []
  try {
    const { data: reqs } = await adminClient
      .from('access_requests')
      .select('*')
      .eq('request_status', 'pending')
      .order('created_at', { ascending: false });
    requests = reqs || [];
  } catch (e) {
    console.error('Failed to load requests', e);
  }

  return {
    props: {
      authorized: true,
      rows: profilesWithNewFields,
      users,
      connections,
      requests,
      error: error ? error.message : errMsg
    }
  }
}

// Helper function to calculate days left
function getDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function AdminDashboard({ authorized, rows, users, connections, requests, error }: Props) {
  if (!authorized) return null

  const [showInviteStudent, setShowInviteStudent] = useState(false)
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [showCreateLovedOne, setShowCreateLovedOne] = useState(false)
  const [activeTab, setActiveTab] = useState<'profiles' | 'requests'>('profiles')
  const [filter, setFilter] = useState<'all' | 'test' | 'real'>('all')
  const [inviteResult, setInviteResult] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<AdminRow | null>(null)
  // Date picker modal state
  const [editingTrialUser, setEditingTrialUser] = useState<{id: string, name: string, currentDate: string} | null>(null)
  const [newTrialDate, setNewTrialDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const onInviteStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const displayName = (form.elements.namedItem("displayName") as HTMLInputElement).value
    const yearGroup = (form.elements.namedItem("yearGroup") as HTMLSelectElement).value
    const trialDays = parseInt((form.elements.namedItem("trialDays") as HTMLInputElement).value) || 14
    
    const isTest = (form.elements.namedItem("isTest") as HTMLInputElement)?.checked ?? true
    
    const res = await fetch("/api/admin/invite-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, yearGroup, trialDays, isTest })
    })
    
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      const data = await res.json()
      setInviteResult(data)
    }
  }

  const onCreateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const displayName = (form.elements.namedItem("displayName") as HTMLInputElement).value
    const yearGroup = (form.elements.namedItem("yearGroup") as HTMLSelectElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value || undefined
    const isTest = (form.elements.namedItem("isTest") as HTMLInputElement)?.checked ?? true
    
    const res = await fetch("/api/admin/create-test-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, yearGroup, password, isTest })
    })
    
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      const data = await res.json()
      alert(`Student created!\n\nLogin Email: ${data.email}\nPassword: ${password || 'TestPass123!'}\nTrial ends: ${new Date(data.trialEndsAt).toLocaleDateString()}\n\nShare these credentials with the test user.`)
      window.location.reload()
    }
  }

  const onCreateLovedOne = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const displayName = (form.elements.namedItem("displayName") as HTMLInputElement).value
    const studentUserId = (form.elements.namedItem("studentUserId") as HTMLSelectElement).value
    const relationship = (form.elements.namedItem("relationship") as HTMLSelectElement).value
    const nickname = (form.elements.namedItem("nickname") as HTMLInputElement).value
    const isTest = (form.elements.namedItem("isTest") as HTMLInputElement)?.checked ?? true
    
    const res = await fetch("/api/admin/create-test-loved-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, studentUserId, relationship, nickname, isTest })
    })
    
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      const data = await res.json()
      alert(`Loved one created and linked!\n\nLogin Email: ${data.email}\nPassword: TestPass123!\n\nShare these credentials with the loved one.`)
      window.location.reload()
    }
  }

  const extendTrial = async (userId: string, days: number) => {
    const res = await fetch("/api/admin/extend-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, extensionDays: days })
    })
    if (!res.ok) {
      alert("Failed to extend trial")
    } else {
      alert(`Trial extended by ${days} days`)
      window.location.reload()
    }
  }

  const deleteAccount = async (userId: string) => {
    if (!confirm("Delete this test account?")) return
    const res = await fetch("/api/admin/delete-test-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      alert("Account deleted")
      window.location.reload()
    }
  }

  // Open date picker modal for a user
  const openTrialDateEditor = (user: AdminRow) => {
    // Get current date string - use fallback for array index (TypeScript strict mode)
    const getDateStr = (dt: Date): string => {
      const parts = dt.toISOString().split('T');
      return parts[0] || new Date().toISOString().slice(0, 10);
    };
    
    const currentDate: string = user.trial_ends_at 
      ? getDateStr(new Date(user.trial_ends_at))
      : getDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default: 30 days from now
    
    // user.id is required in AdminRow
    const userId: string = user.id;
    const userName: string = user.display_name ?? user.email ?? 'User';
    
    setEditingTrialUser({
      id: userId,
      name: userName,
      currentDate: currentDate
    });
    setNewTrialDate(currentDate);
  }

  // Submit the new trial date
  const submitTrialDate = async () => {
    if (!editingTrialUser || !newTrialDate) return;
    
    const res = await fetch("/api/admin/set-trial-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editingTrialUser.id, trialEndsAt: newTrialDate })
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      alert("Trial date updated")
      setEditingTrialUser(null);
      window.location.reload()
    }
  }

  // Copy email to clipboard
  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      alert(`Copied to clipboard:\n${email}`)
    } catch {
      // Fallback for older browsers
      prompt("Copy this email:", email)
    }
  }

  // Reset password for a user
  const resetPassword = async (userId: string, email: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) return
    
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email })
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      alert(`Password reset email sent to ${email}`)
    }
  }

  // Remove AWY connection
  const removeConnection = async (connectionId: string) => {
    const res = await fetch("/api/admin/remove-awy-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ connectionId })
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      alert("Connection removed")
      window.location.reload()
    }
  }

  // Access Request Handlers
  const approveRequest = async (requestId: string) => {
    try {
      const res = await fetch('/api/admin/approve-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Show invite link
      prompt(
        `✅ Request Approved!\n\nHere is the INVITE LINK for ${data.email}.\nCopy and send it to them manually if needed (safety first):`,
        data.inviteUrl
      );
      window.location.reload();
    } catch (e: any) {
      alert(`Approval Failed: ${e.message}`);
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!confirm('Reject this request?')) return;
    try {
      const res = await fetch('/api/admin/reject-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      alert('Request Rejected.');
      window.location.reload();
    } catch (e: any) {
      alert(`Rejection Failed: ${e.message}`);
    }
  };

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Toggle selection for a single row
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Toggle all visible rows
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)))
    }
  }

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected items? This cannot be undone.`)) return

    let successCount = 0
    let failCount = 0
    let errors: string[] = []

    const idsToDelete = Array.from(selectedIds)
    
    for (const id of idsToDelete) {
      const row = rows.find(r => r.id === id)
      if (!row) continue

      let res: Response;
      
      if (id.startsWith('invite_')) {
        const cleanId = id.replace('invite_', '');
        res = await fetch("/api/admin/delete-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: cleanId })
        })
      } else {
        if (!row.is_test_account) {
            failCount++
            errors.push(`${row.email}: Skip (Not TEST account)`)
            continue
        }
        res = await fetch("/api/admin/delete-test-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: row.user_id || row.id })
        })
      }

      if (res.ok) {
        successCount++
      } else {
        failCount++
        try {
            const errData = await res.json();
            errors.push(`${row.email || id}: ${errData.error || 'Unknown error'}`);
        } catch {
            errors.push(`${row.email || id}: HTTP ${res.status}`);
        }
      }
    }

    if (errors.length > 0) {
        alert(`Bulk Delete Results:\nDeleted: ${successCount}\nFailed: ${failCount}\n\nErrors:\n${errors.join('\n')}`)
    } else {
        alert(`Successfully deleted ${successCount} items.`)
    }
    window.location.reload()
  }

  // Bulk Extend
  const handleBulkExtend = async (days: number) => {
    const count = selectedIds.size
    if (!confirm(`Extend trial by ${days} days for ${count} users?`)) return

    for (const id of Array.from(selectedIds)) {
      if (id.startsWith('invite_')) continue
      const row = rows.find(r => r.id === id)
      if (row) {
        await fetch("/api/admin/extend-trial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: row.user_id || row.id, extensionDays: days })
        })
      }
    }
    alert("Bulk extension complete")
    window.location.reload()
  }

  const students = rows.filter(r => r.user_role === 'student')
  
  // Filter by query and type
  const filteredRows = rows.filter(r => {
    // 1. Filter by Search Query (Email or Name)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const match = (r.email?.toLowerCase().includes(q)) || (r.display_name?.toLowerCase().includes(q))
      if (!match) return false
    }
    
    // 2. Filter by Type
    if (filter === 'test') return r.is_test_account
    if (filter === 'real') return !r.is_test_account
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Manage students, trials, and AWY connections</p>
          </div>
          <form method="POST" action="/api/admin/logout">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition"
            >
              Log out
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Quick Actions / Bulk Actions Toolbar */}
        {selectedIds.size > 0 ? (
          <div className="mb-6 p-4 border border-purple-200 bg-purple-50 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="font-bold text-purple-900">{selectedIds.size} Selected</span>
              <button onClick={() => setSelectedIds(new Set())} className="text-purple-600 text-sm hover:underline">Clear</button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkExtend(7)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
              >
                +7 Days Trial
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 border border-blue-100 bg-blue-50 rounded-xl">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h2>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => {
                  setInviteResult(null);
                  setShowInviteStudent(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                📧 Invite Student
              </button>
              <button 
                onClick={() => setShowCreateStudent(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                + Create with Password
              </button>
              <button 
                onClick={() => setShowCreateLovedOne(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                + Create Loved One
              </button>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-6 py-3 text-sm font-medium transition ${
              activeTab === 'profiles'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            User Profiles
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Access Requests
            {requests.length > 0 && (
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'requests' ? (
          /* ACCESS REQUESTS TABLE */
          <div className="overflow-auto border border-slate-100 rounded-xl mb-8 animate-in fade-in slide-in-from-left-4">
             <table className="min-w-full text-sm">
               <thead className="bg-slate-50 text-slate-500">
                 <tr>
                   <th className="px-4 py-3 text-left">Date</th>
                   <th className="px-4 py-3 text-left">Name / Email</th>
                   <th className="px-4 py-3 text-left">Cohort</th>
                   <th className="px-4 py-3 text-left w-1/3">Message</th>
                   <th className="px-4 py-3 text-left">Details</th>
                   <th className="px-4 py-3 text-left">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {requests.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                       No pending requests.
                     </td>
                   </tr>
                 ) : (
                   requests.map((req) => (
                     <tr key={req.id} className="hover:bg-slate-50 transition">
                       <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                         {new Date(req.created_at).toLocaleDateString()}
                       </td>
                       <td className="px-4 py-3">
                         <div className="font-medium text-slate-900">{req.name}</div>
                         <div className="text-slate-500 text-xs font-mono">{req.email}</div>
                       </td>
                       <td className="px-4 py-3">
                         <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100 uppercase">
                           {req.cohort}
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         <div className="text-slate-600 text-xs line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100 italic">
                           "{req.message || 'No message'}"
                         </div>
                       </td>
                       <td className="px-4 py-3 text-xs text-slate-500">
                         {req.expected_term && <div>Term: {req.expected_term}</div>}
                         {req.college && <div>College: {req.college}</div>}
                         <div className="mt-1 text-[10px] text-slate-400">IP: {req.ip_hash?.substring(0,8)}...</div>
                       </td>
                       <td className="px-4 py-3">
                         <div className="flex gap-2">
                           <button
                             onClick={() => approveRequest(req.id)}
                             className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow-sm transition"
                           >
                             Approve
                           </button>
                           <button
                             onClick={() => rejectRequest(req.id)}
                             className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition"
                           >
                             Reject
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        ) : (
          /* PROFILES CONTENT (Original) */
          <>
        {/* Filter & Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <input 
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
            <button onClick={() => setFilter('test')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'test' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Test Only</button>
            <button onClick={() => setFilter('real')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'real' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Real Only</button>
          </div>
        </div>

        {/* Profiles Table */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">
            Profiles ({filteredRows.length})
            <span className="text-sm font-normal text-slate-500 ml-2">
              [Test: {rows.filter(r => r.is_test_account).length} | Real: {rows.filter(r => !r.is_test_account).length}]
            </span>
          </h2>
        </div>
        <div className="overflow-auto border border-slate-100 rounded-xl mb-8">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left px-2 py-2 w-10">#</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-left px-3 py-2">Connections</th>
                <th className="text-left px-3 py-2">Trial Ends</th>
                <th className="text-left px-3 py-2">Days Left</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, index) => {
                const daysLeft = getDaysLeft(r.trial_ends_at);
                const isSelected = selectedIds.has(r.id);
                
                return (
                  <tr 
                    key={r.id} 
                    className={`border-t border-slate-100 transition-colors ${
                      isSelected 
                        ? 'bg-blue-50' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                       <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isSelected}
                        onChange={() => toggleSelection(r.id)}
                      />
                    </td>
                    <td className="px-2 py-2 text-center text-slate-400 font-mono" onClick={() => setSelectedStudent(r)}>{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={r.is_test_account ? 'font-mono text-xs bg-yellow-50 px-2 py-1 rounded border border-yellow-200' : ''}>
                            {r.email || '-'}
                          </span>
                          {r.is_test_account && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold">TEST</span>}
                        </div>
                        {r.is_test_account && r.email && (
                          <button 
                            onClick={() => copyEmail(r.email!)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 w-fit"
                          >
                            📋 Copy Login Email
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">{r.display_name || '-'}</td>
                    <td className="px-3 py-2">{r.user_role || '-'}</td>
                    <td className="px-3 py-2">
                       {r.user_role === 'student' ? (
                         <div className="flex flex-col">
                            <span className="text-xs font-semibold text-purple-600">
                              LO: {connections.filter(c => c.studentId === r.id || c.studentEmail === r.email).length}
                            </span>
                            <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                              {connections.filter(c => c.studentId === r.id || c.studentEmail === r.email)
                                .map(c => c.lovedEmail).join(', ') || 'No connections'}
                            </div>
                         </div>
                       ) : (
                         <div className="flex flex-col">
                            <span className="text-xs font-semibold text-blue-600">Linked to:</span>
                            <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                              {connections.find(c => c.lovedOneId === r.id || c.lovedEmail === r.email)?.studentEmail || '-'}
                            </span>
                         </div>
                       )}
                    </td>
                    <td className="px-3 py-2">{r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">
                      {daysLeft !== null ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          daysLeft > 7 ? 'bg-green-100 text-green-800' :
                          daysLeft >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          daysLeft > 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {daysLeft > 0 ? `${daysLeft}d` : 'Expired'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {r.subscription_status === 'invited' ? (
                           <div className="flex items-center gap-2">
                             <div className="flex flex-col">
                               <span className="text-orange-600 text-xs font-semibold flex items-center gap-1">
                                 <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                 Pending
                               </span>
                               <span className="text-[10px] text-gray-400">Wait for signup</span>
                             </div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); deleteInvitation(r.id); }} 
                               className="text-red-600 hover:underline text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-100"
                             >
                               Del
                             </button>
                           </div>
                        ) : (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); extendTrial(r.user_id || r.id, 7); }} className="text-blue-600 hover:underline text-xs">+7d</button>
                            <button onClick={(e) => { e.stopPropagation(); openTrialDateEditor(r); }} className="text-green-600 hover:underline text-xs">Edit</button>
                            {r.email && (
                              <button onClick={() => resetPassword(r.user_id || r.id, r.email!)} className="text-purple-600 hover:underline text-xs">🔑Reset</button>
                            )}
                            {(r.is_test_account || r.user_role === 'loved_one') && (
                              <button onClick={() => deleteAccount(r.user_id || r.id)} className="text-red-600 hover:underline text-xs">Del</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AWY Connections */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">
            {selectedStudent 
              ? `AWY Connections for ${selectedStudent.display_name || selectedStudent.email}` 
              : 'AWY Connections (All)'}
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({selectedStudent 
                ? connections.filter(c => c.studentEmail === selectedStudent.email).length 
                : connections.length})
            </span>
          </h2>
          {selectedStudent && (
            <button
              onClick={() => {
                // Pre-select this student in the Create Loved One modal
                setShowCreateLovedOne(true)
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700"
            >
              + Add Loved One for {selectedStudent.display_name || 'Student'}
            </button>
          )}
        </div>
        <div className="overflow-auto border border-slate-100 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-2 py-2 w-10">#</th>
                <th className="text-left px-3 py-2">Student</th>
                <th className="text-left px-3 py-2">Loved One</th>
                <th className="text-left px-3 py-2">Relationship</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredConns = selectedStudent 
                  ? connections.filter(c => c.studentId === selectedStudent.id || c.studentEmail === selectedStudent.email)
                  : connections;
                
                if (filteredConns.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                        {selectedStudent 
                          ? `No loved ones connected for ${selectedStudent.display_name || selectedStudent.email}`
                          : 'No AWY connections yet'}
                      </td>
                    </tr>
                  );
                }
                
                return filteredConns.map((c, index) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-3 py-2">{c.studentEmail}</td>
                    <td className="px-3 py-2">{c.lovedEmail}</td>
                    <td className="px-3 py-2">{c.relationship}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.status === 'active' || c.status === 'granted' || c.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        c.status === 'pending' || c.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                        c.status === 'revoked' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove ${c.lovedEmail} as loved one for ${c.studentEmail}?`)) {
                            removeConnection(c.id);
                          }
                        }}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>

      {/* Invite Student Modal */}
      {showInviteStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {!inviteResult ? (
              <>
                <h3 className="text-lg font-bold mb-4">Invite Test Student</h3>
                <form onSubmit={onInviteStudent} className="space-y-3">
                  <input name="email" placeholder="Gmail address" type="email" className="w-full border rounded px-3 py-2" required />
                  <input name="displayName" placeholder="Display Name" className="w-full border rounded px-3 py-2" required />
                  <select name="yearGroup" className="w-full border rounded px-3 py-2" required>
                    <option value="">Select Year</option>
                    <option value="foundation">Foundation</option>
                    <option value="year1">Year 1</option>
                    <option value="year2">Year 2</option>
                    <option value="year3">Year 3</option>
                  </select>
                  <input name="trialDays" type="number" placeholder="Trial days (default: 14)" className="w-full border rounded px-3 py-2" defaultValue="14" />
                  <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" name="isTest" id="isTestInvite" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <label htmlFor="isTestInvite" className="text-sm font-medium text-slate-700">Mark as Test Account (Enable direct delete)</label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold">Send Invite</button>
                    <button type="button" onClick={() => setShowInviteStudent(false)} className="px-4 py-2 bg-slate-200 rounded">Cancel</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-4 text-green-600">✅ Invite Sent!</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-gray-700 mb-1"><strong>Email:</strong> {inviteResult.email}</p>
                    <p className="text-sm text-gray-700 mb-1"><strong>Expires:</strong> {new Date(inviteResult.expiresAt).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-700"><strong>Email sent:</strong> {inviteResult.emailSent ? 'Yes ✓' : 'No (configure RESEND_API_KEY)'}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Invite Link:</p>
                    <input 
                      readOnly 
                      value={inviteResult.inviteUrl} 
                      className="w-full text-xs p-2 border rounded bg-white"
                      onClick={(e) => e.currentTarget.select()}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.inviteUrl);
                      alert('Copied to clipboard!');
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded font-semibold"
                  >
                    Copy Link
                  </button>
                  <button 
                    onClick={() => {
                      setShowInviteStudent(false);
                      window.location.reload();
                    }}
                    className="w-full py-2 bg-slate-200 rounded"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Student Modal (Password-based - works without migration) */}
      {showCreateStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Create Test Student (Password)</h3>
            <form onSubmit={onCreateStudent} className="space-y-3">
              <input name="email" placeholder="Email or Test ID (e.g. TestUser1)" className="w-full border rounded px-3 py-2" required />
              <input name="displayName" placeholder="Display Name" className="w-full border rounded px-3 py-2" required />
              <p className="text-xs text-gray-500 -mt-2">Non-email IDs get auto-generated login emails</p>
              <select name="yearGroup" className="w-full border rounded px-3 py-2" required>
                <option value="">Select Year</option>
                <option value="foundation">Foundation</option>
                <option value="year1">Year 1</option>
                <option value="year2">Year 2</option>
                <option value="year3">Year 3</option>
              </select>
              <input 
                name="password" 
                type="text"
                placeholder="Password (optional, default: TestPass123!)" 
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500">Leave blank for default password: TestPass123!</p>
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" name="isTest" id="isTestStudent" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <label htmlFor="isTestStudent" className="text-sm font-medium text-slate-700">Mark as Test Account (Enable direct delete)</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded font-semibold">Create</button>
                <button type="button" onClick={() => setShowCreateStudent(false)} className="px-4 py-2 bg-slate-200 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Loved One Modal */}
      {showCreateLovedOne && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Create Test Loved One 
              {selectedStudent && <span className="text-sm font-normal text-slate-500 ml-2">for {selectedStudent.display_name || selectedStudent.email}</span>}
            </h3>
            <form onSubmit={onCreateLovedOne} className="space-y-3">
              <input name="email" placeholder="Email or Test ID (e.g. TestMom)" className="w-full border rounded px-3 py-2" required />
              <input name="displayName" placeholder="Display Name" className="w-full border rounded px-3 py-2" required />
              <p className="text-xs text-gray-500 -mt-2">Non-email IDs get auto-generated login emails</p>
              <select name="studentUserId" className="w-full border rounded px-3 py-2" required defaultValue={selectedStudent?.id || ''}>
                <option value="">Link to Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.email} ({s.display_name})</option>
                ))}
              </select>
              <select name="relationship" className="w-full border rounded px-3 py-2" required>
                <option value="">Relationship</option>
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="sibling">Sibling</option>
                <option value="partner">Partner</option>
                <option value="friend">Friend</option>
              </select>
              <input name="nickname" placeholder="Nickname (e.g., Mum, Dad)" className="w-full border rounded px-3 py-2" />
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" name="isTest" id="isTestLO" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <label htmlFor="isTestLO" className="text-sm font-medium text-slate-700">Mark as Test Account (Enable direct delete)</label>
              </div>
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" name="isTest" id="isTestLO" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <label htmlFor="isTestLO" className="text-sm font-medium text-slate-700">Mark as Test Account (Enable direct delete)</label>
              </div>
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" name="isTest" id="isTestLO" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <label htmlFor="isTestLO" className="text-sm font-medium text-slate-700">Mark as Test Account (Enable direct delete)</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded font-semibold">Create</button>
                <button type="button" onClick={() => setShowCreateLovedOne(false)} className="px-4 py-2 bg-slate-200 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trial Date Modal */}
      {editingTrialUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              Set Trial End Date
              <span className="text-sm font-normal text-slate-500 block mt-1">
                for {editingTrialUser.name}
              </span>
            </h3>
            
            <div className="space-y-4">
              {/* Current date info */}
              <div className="text-sm text-slate-600">
                Current: <span className="font-mono">{editingTrialUser.currentDate}</span>
              </div>
              
              {/* Date picker input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Trial End Date
                </label>
                <input
                  type="date"
                  value={newTrialDate}
                  onChange={(e) => setNewTrialDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Quick select buttons */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 w-full">Quick select:</span>
                {[7, 14, 30, 60, 90].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + days);
                      setNewTrialDate(date.toISOString().slice(0, 10));
                    }}
                    className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition"
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={submitTrialDate}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Save Date
              </button>
              <button 
                onClick={() => setEditingTrialUser(null)}
                className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
