import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { parse } from 'cookie'
import { createHmac } from 'crypto'

type Ticket = {
  id: string
  subject: string
  status: string
  priority: string
  updated_at: string
  user_id: string | null
  visitor_email: string | null
  visitor_name: string | null
  is_visitor: boolean
}

type Props = { authorized: boolean }

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
    return { redirect: { destination: '/admin/login', permanent: false }, props: { authorized: false } }
  }
  return { props: { authorized: true } }
}

export default function AdminSupportList({ authorized }: Props) {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authorized) return
    fetch('/.netlify/functions/support-list-tickets')
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || 'Failed')
        setTickets(json.tickets || [])
      })
      .catch((e) => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [authorized])

  const filtered = tickets.filter((t) => {
    const matchesStatus = statusFilter ? t.status === statusFilter : true
    const matchesPri = priorityFilter ? t.priority === priorityFilter : true
    const lower = search.toLowerCase()
    const matchesSearch =
      !search.length ||
      t.subject.toLowerCase().includes(lower) ||
      (t.visitor_email || '').toLowerCase().includes(lower) ||
      (t.visitor_name || '').toLowerCase().includes(lower)
    return matchesStatus && matchesPri && matchesSearch
  })

  const statusColor = (s: string) =>
    s === 'resolved' ? 'text-green-600' : s === 'pending' ? 'text-amber-600' : 'text-slate-600'

  if (!authorized) return null

  return (
    <>
      <Head><title>Admin Support - MyDurhamLaw</title></Head>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
            <p className="text-sm text-slate-600">Admin view of tickets (latest 200)</p>
          </div>
          <div className="flex gap-2 text-sm">
            <input className="border rounded px-2 py-1" placeholder="search subject/email" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="border rounded px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Status</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="border rounded px-2 py-1" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
        {loading && <div className="text-sm text-slate-500">Loading…</div>}

        <div className="overflow-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Subject</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Priority</th>
                <th className="text-left px-3 py-2">User / Visitor</th>
                <th className="text-left px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs cursor-pointer" onClick={() => router.push(`/admin/support/${t.id}`)}>
                    {t.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">{t.subject}</td>
                  <td className={`px-3 py-2 font-semibold ${statusColor(t.status)}`}>{t.status}</td>
                  <td className="px-3 py-2 capitalize">{t.priority}</td>
                  <td className="px-3 py-2">
                    {t.is_visitor ? (t.visitor_email || 'visitor') : (t.user_id || 'user')}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{new Date(t.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td className="px-3 py-4 text-center text-slate-500" colSpan={6}>No tickets</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
