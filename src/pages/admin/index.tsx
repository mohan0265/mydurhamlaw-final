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
      props: { authorized: false, rows: [], users: [], connections: [], error: null }
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

    // Fetch AWY connections (use id not user_id)
    const { data: conns } = await adminClient
      .from('awy_connections')
      .select(`
        id,
        loved_email,
        relationship,
        status,
        created_at,
        student:profiles!awy_connections_student_user_id_fkey(id),
        loved:profiles!awy_connections_loved_user_id_fkey(id)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (conns) {
      connections = conns.map((c: any) => {
        const studentEmail = users.find(u => u.id === c.student?.id)?.email || '-'
        const lovedEmail = c.loved_email || users.find(u => u.id === c.loved?.id)?.email || '-'
        return {
          id: c.id,
          studentEmail,
          lovedEmail,
          relationship: c.relationship || '-',
          status: c.status || '-',
          createdAt: c.created_at || '-'
        }
      })
    }
  } catch (e: any) {
    errMsg = e?.message || "Failed to load auth users"
  }

  return {
    props: {
      authorized: true,
      rows: profilesWithNewFields,
      users,
      connections,
      error: error ? error.message : errMsg
    }
  }
}

export default function AdminDashboard({ authorized, rows, users, connections, error }: Props) {
  if (!authorized) return null

  const [showInviteStudent, setShowInviteStudent] = useState(false)
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [showCreateLovedOne, setShowCreateLovedOne] = useState(false)
  const [filter, setFilter] = useState<'all' | 'test' | 'real'>('all')
  const [inviteResult, setInviteResult] = useState<any>(null)

  const onInviteStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const displayName = (form.elements.namedItem("displayName") as HTMLInputElement).value
    const yearGroup = (form.elements.namedItem("yearGroup") as HTMLSelectElement).value
    const trialDays = parseInt((form.elements.namedItem("trialDays") as HTMLInputElement).value) || 14
    
    const res = await fetch("/api/admin/invite-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, yearGroup, trialDays })
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
    
    const res = await fetch("/api/admin/create-test-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, yearGroup, password })
    })
    
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      const data = await res.json()
      alert(`Student created! Password: ${password || 'TestPass123!'}\nTrial ends: ${data.trialEndsAt}`)
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
    
    const res = await fetch("/api/admin/create-test-loved-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, studentUserId, relationship, nickname })
    })
    
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      alert(`Loved one created and linked!`)
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

  const setTrialDate = async (userId: string) => {
    const dateStr = prompt("Enter new trial end date (YYYY-MM-DD):")
    if (!dateStr) return
    
    const res = await fetch("/api/admin/set-trial-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, trialEndsAt: dateStr })
    })
    if (!res.ok) {
      const err = await res.json()
      alert(`Failed: ${err.error}`)
    } else {
      alert("Trial date updated")
      window.location.reload()
    }
  }


  const students = rows.filter(r => r.user_role === 'student')
  const filteredRows = 
    filter === 'all' 
      ? rows 
      : filter === 'test' 
        ? rows.filter(r => r.is_test_account) 
        : rows.filter(r => !r.is_test_account);

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

        {/* Quick Actions */}
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
              📧 Invite Student (needs DB migration)
            </button>
            <button 
              onClick={() => setShowCreateStudent(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
            >
              + Create with Password (works now)
            </button>
            <button 
              onClick={() => setShowCreateLovedOne(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
            >
              + Create Loved One
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>All</button>
          <button onClick={() => setFilter('test')} className={`px-3 py-1 rounded text-sm ${filter === 'test' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Test Only</button>
          <button onClick={() => setFilter('real')} className={`px-3 py-1 rounded text-sm ${filter === 'real' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Real Only</button>
        </div>

        {/* Profiles Table */}
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Profiles ({filteredRows.length})</h2>
        <div className="overflow-auto border border-slate-100 rounded-xl mb-8">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-left px-3 py-2">Year</th>
                <th className="text-left px-3 py-2">Subscription</th>
                <th className="text-left px-3 py-2">Trial Ends</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    {r.email || '-'}
                    {r.is_test_account && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">TEST</span>}
                  </td>
                  <td className="px-3 py-2">{r.display_name || '-'}</td>
                  <td className="px-3 py-2">{r.user_role || '-'}</td>
                  <td className="px-3 py-2">{r.year_group || '-'}</td>
                  <td className="px-3 py-2">{r.subscription_status || 'trial'}</td>
                  <td className="px-3 py-2">{r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button onClick={() => extendTrial(r.user_id || r.id, 7)} className="text-blue-600 hover:underline text-xs">+7d</button>
                    <button onClick={() => setTrialDate(r.user_id || r.id)} className="text-green-600 hover:underline text-xs">Edit</button>
                    {r.is_test_account && (
                      <button onClick={() => deleteAccount(r.user_id || r.id)} className="text-red-600 hover:underline text-xs">Del</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AWY Connections */}
        <h2 className="text-lg font-semibold text-slate-800 mb-2">AWY Connections ({connections.length})</h2>
        <div className="overflow-auto border border-slate-100 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-3 py-2">Student</th>
                <th className="text-left px-3 py-2">Loved One</th>
                <th className="text-left px-3 py-2">Relationship</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{c.studentEmail}</td>
                  <td className="px-3 py-2">{c.lovedEmail}</td>
                  <td className="px-3 py-2">{c.relationship}</td>
                  <td className="px-3 py-2">{c.status}</td>
                  <td className="px-3 py-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <input name="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
              <input name="displayName" placeholder="Display Name" className="w-full border rounded px-3 py-2" required />
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
            <h3 className="text-lg font-bold mb-4">Create Test Loved One</h3>
            <form onSubmit={onCreateLovedOne} className="space-y-3">
              <input name="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
              <input name="displayName" placeholder="Display Name" className="w-full border rounded px-3 py-2" required />
              <select name="studentUserId" className="w-full border rounded px-3 py-2" required>
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
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded font-semibold">Create</button>
                <button type="button" onClick={() => setShowCreateLovedOne(false)} className="px-4 py-2 bg-slate-200 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
