import { GetServerSideProps } from 'next'
import { parse } from 'cookie'
import { createHmac } from 'crypto'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

// ... type definitions omitted for brevity

type AdminRow = {
  id: string
  display_name: string | null
  user_role: string | null
  year_group: string | null
  trial_started_at: string | null
  trial_ever_used: boolean | null
}

type AdminUser = {
  id: string
  email: string | null
  created_at: string | null
  last_sign_in_at: string | null
  provider: string | null
}

type Props = {
  authorized: boolean
  rows: AdminRow[]
  users: AdminUser[]
  error?: string | null
}

const COOKIE_NAME = 'admin_session'

function expectedToken() {
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (!adminUser || !adminPass) return null
  return createHmac('sha256', adminPass).update(adminUser).digest('hex')
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const token = parse(ctx.req.headers.cookie || '')[COOKIE_NAME]
  const exp = expectedToken()
  if (!token || !exp || token !== exp) {
    return {
      redirect: { destination: '/admin/login', permanent: false },
      props: { authorized: false, rows: [], users: [], error: null }
    }
  }

  const adminClient = getSupabaseAdmin()
  if (!adminClient) {
    return {
      props: {
        authorized: true,
        rows: [],
        users: [],
        error: 'Server misconfigured: missing Supabase admin env vars'
      }
    }
  }

  // Fetch profile + trial info
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, display_name, user_role, year_group, trial_started_at, trial_ever_used')
    .order('updated_at', { ascending: false })
    .limit(200)

  let users: AdminUser[] = []
  let errMsg: string | null = null
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
  } catch (e: any) {
    errMsg = e?.message || 'Failed to load auth users'
  }

  return {
    props: {
      authorized: true,
      rows: (data as AdminRow[]) || [],
      users,
      error: error ? error.message : errMsg
    }
  }
}

export default function AdminDashboard({ authorized, rows, users, error }: Props) {
  if (!authorized) return null

  const onUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const id = (form.elements.namedItem('profile_id') as HTMLInputElement).value
    const display_name = (form.elements.namedItem('display_name') as HTMLInputElement).value
    const user_role = (form.elements.namedItem('user_role') as HTMLInputElement).value
    const year_group = (form.elements.namedItem('year_group') as HTMLInputElement).value
    const res = await fetch('/api/admin/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, display_name, user_role, year_group })
    })
    if (!res.ok) {
      alert('Update failed')
    } else {
      alert('Profile updated')
    }
  }

  const onUpdateConnection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const connection_id = (form.elements.namedItem('connection_id') as HTMLInputElement).value
    const loved_email = (form.elements.namedItem('loved_email') as HTMLInputElement).value
    const relationship = (form.elements.namedItem('relationship') as HTMLInputElement).value
    const nickname = (form.elements.namedItem('nickname') as HTMLInputElement).value
    const status = (form.elements.namedItem('status') as HTMLInputElement).value
    const res = await fetch('/api/admin/update-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id, loved_email, relationship, nickname, status })
    })
    if (!res.ok) {
      alert('Update failed')
    } else {
      alert('Connection updated')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Profiles, trial flags, and roles.</p>
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

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <form onSubmit={onUpdateProfile} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Edit Profile</h2>
            <input name="profile_id" placeholder="Profile ID" className="w-full border rounded px-3 py-2 text-sm" required />
            <input name="display_name" placeholder="Display Name" className="w-full border rounded px-3 py-2 text-sm" />
            <input name="user_role" placeholder="Role (student/loved_one)" className="w-full border rounded px-3 py-2 text-sm" />
            <input name="year_group" placeholder="Year (year1/year2/year3/foundation)" className="w-full border rounded px-3 py-2 text-sm" />
            <button type="submit" className="w-full py-2 rounded bg-slate-800 text-white text-sm font-semibold">Save Profile</button>
          </form>

          <form onSubmit={onUpdateConnection} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Edit AWY Connection</h2>
            <input name="connection_id" placeholder="Connection ID" className="w-full border rounded px-3 py-2 text-sm" required />
            <input name="loved_email" placeholder="Loved Email" className="w-full border rounded px-3 py-2 text-sm" />
            <input name="relationship" placeholder="Relationship" className="w-full border rounded px-3 py-2 text-sm" />
            <input name="nickname" placeholder="Nickname" className="w-full border rounded px-3 py-2 text-sm" />
            <input name="status" placeholder="Status (active/granted/pending/revoked)" className="w-full border rounded px-3 py-2 text-sm" />
            <button type="submit" className="w-full py-2 rounded bg-slate-800 text-white text-sm font-semibold">Save Connection</button>
          </form>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mb-2">Profiles</h2>
        <div className="overflow-auto border border-slate-100 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-left px-3 py-2">Year</th>
                <th className="text-left px-3 py-2">Trial Started</th>
                <th className="text-left px-3 py-2">Ever Used Trial</th>
              </tr>
              </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{r.id}</td>
                  <td className="px-3 py-2">{r.display_name || '—'}</td>
                  <td className="px-3 py-2">{r.user_role || '—'}</td>
                  <td className="px-3 py-2">{r.year_group || '—'}</td>
                  <td className="px-3 py-2">{r.trial_started_at || '—'}</td>
                  <td className="px-3 py-2">{r.trial_ever_used ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={6}>
                    No profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-2">Auth Users</h2>
        <div className="overflow-auto border border-slate-100 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Provider</th>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Last Sign In</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{u.id}</td>
                  <td className="px-3 py-2">{u.email || '—'}</td>
                  <td className="px-3 py-2">{u.provider || '—'}</td>
                  <td className="px-3 py-2">{u.created_at || '—'}</td>
                  <td className="px-3 py-2">{u.last_sign_in_at || '—'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={5}>
                    No auth users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
