import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import toast from 'react-hot-toast'
import { GetServerSideProps } from 'next'
import { parse } from 'cookie'
import { createHmac } from 'crypto'

type Message = { id: string; role: string; content: string; created_at: string }

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

export default function AdminSupportDetail({ authorized }: Props) {
  const router = useRouter()
  const { id } = router.query as { id?: string }
  const [messages, setMessages] = useState<Message[]>([])
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [updateStatus, setUpdateStatus] = useState('')
  const [updatePriority, setUpdatePriority] = useState('')
  const [updateTags, setUpdateTags] = useState('')
  const [adminReply, setAdminReply] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!authorized || !id) return
    setLoading(true)
    fetch('/.netlify/functions/support-get-thread', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: id, user_id: null, visitor_token: '' })
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || 'Failed')
        setTicket(json.ticket)
        setMessages(json.messages || [])
        setUpdateStatus(json.ticket?.status || '')
        setUpdatePriority(json.ticket?.priority || '')
        setUpdateTags((json.ticket?.tags || []).join(','))
      })
      .catch((e) => setErr(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [authorized, id])

  const saveUpdate = async () => {
    if (!id) return
    const res = await fetch('/.netlify/functions/support-update-ticket', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: id,
        status: updateStatus || undefined,
        priority: updatePriority || undefined,
        tags: updateTags ? updateTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined
      })
    })
    const json = await res.json()
    if (!json.ok) {
      toast.error(json.error || 'Update failed')
    } else {
      toast.success('Updated')
    }
  }

  const sendAdminReply = async () => {
    if (!id || !adminReply.trim()) return
    const res = await fetch('/.netlify/functions/support-admin-reply', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: id, content: adminReply })
    })
    const json = await res.json()
    if (!json.ok) {
      toast.error(json.error || 'Reply failed')
    } else {
      toast.success('Reply sent')
      setAdminReply('')
      router.replace(router.asPath)
    }
  }

  const addNote = async () => {
    if (!id || !note.trim()) return
    const res = await fetch('/.netlify/functions/support-add-admin-note', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: id, note })
    })
    const json = await res.json()
    if (!json.ok) toast.error(json.error || 'Note failed')
    else {
      toast.success('Note added')
      setNote('')
    }
  }

  if (!authorized) return null

  return (
    <>
      <Head><title>Support Ticket {id}</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button className="text-sm text-purple-600 mb-3" onClick={() => router.push('/admin/support')}>← Back to list</button>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ticket {id}</h1>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && <div className="text-sm text-slate-500">Loading…</div>}

        {ticket && (
          <div className="grid md:grid-cols-[2fr_1fr] gap-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <div className="text-sm text-slate-600 mb-2">Subject: {ticket.subject}</div>
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className="border-b border-slate-100 pb-2">
                    <div className="text-xs font-semibold text-slate-500">
                      {m.role} • {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-800 whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))}
                {messages.length === 0 && <div className="text-sm text-slate-500">No messages yet.</div>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 text-sm">
                <div className="font-semibold mb-2">Update ticket</div>
                <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} className="border rounded px-2 py-1 w-full mb-2">
                  <option value="">Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select value={updatePriority} onChange={(e) => setUpdatePriority(e.target.value)} className="border rounded px-2 py-1 w-full mb-2">
                  <option value="">Priority</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input placeholder="tags (comma sep)" value={updateTags} onChange={(e) => setUpdateTags(e.target.value)} className="border rounded px-2 py-1 w-full mb-2" />
                <button onClick={saveUpdate} className="w-full py-2 rounded bg-slate-800 text-white font-semibold">Save</button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 text-sm">
                <div className="font-semibold mb-2">Admin reply</div>
                <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} className="border rounded px-2 py-1 w-full mb-2" rows={3} />
                <button onClick={sendAdminReply} className="w-full py-2 rounded bg-purple-600 text-white font-semibold">Send as admin</button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 text-sm">
                <div className="font-semibold mb-2">Internal note</div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className="border rounded px-2 py-1 w-full mb-2" rows={2} />
                <button onClick={addNote} className="w-full py-2 rounded bg-slate-700 text-white font-semibold">Add note</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
