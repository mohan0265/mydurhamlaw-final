import { GetServerSideProps } from 'next'
import { parse } from 'cookie'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'

type AdminRow = {
  id: string
  display_name: string | null
  user_role: string | null
  year_group: string | null
  trial_started_at: string | null
  trial_ever_used: boolean | null
}

type Props = {
  authorized: boolean
  rows: AdminRow[]
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
      props: { authorized: false, rows: [] }
    }
  }

  // Fetch profile + trial info
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, user_role, year_group, trial_started_at, trial_ever_used')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) {
    return { props: { authorized: true, rows: [] } }
  }

  return {
    props: {
      authorized: true,
      rows: data as AdminRow[]
    }
  }
}

export default function AdminDashboard({ authorized, rows }: Props) {
  if (!authorized) return null

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
                    No rows found.
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
