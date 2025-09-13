import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useMemo, useState, useContext } from 'react'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { getBrowserSupabase } from '@/lib/supabase/browser'
import { addStudentTopic } from '@/lib/syllabus/fetch'
import { format } from 'date-fns'

// simple UI helpers
function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`text-sm font-medium ${props.className || ''}`} />
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${props.className || ''}`} />
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${props.className || ''}`} />
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${props.className || ''}`} />
}
function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="checkbox" className={`h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${props.className || ''}`} />
}
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline', size?: 'sm' | 'md' }) {
  const { variant = 'outline', size = 'md', className, ...rest } = props
  const cls = [
    'inline-flex items-center justify-center rounded-md transition-colors',
    size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
    variant === 'solid'
      ? 'bg-purple-600 text-white hover:bg-purple-700'
      : 'border hover:bg-gray-50'
  ].join(' ')
  return <button {...rest} className={`${cls} ${className || ''}`} />
}

type EventKind = 'lecture' | 'seminar' | 'tutorial' | 'assessment' | 'exam'

type FormState = {
  academic_year: string
  year: number
  term: 'michaelmas' | 'epiphany' | 'easter'
  week: number
  module_code: string
  module_title: string
  kind: EventKind
  date: string
  start_time: string
  end_time: string
  location: string
  title: string
  notes: string
  apply_scope: 'mine' | 'cohort'
  consent_affects_all: boolean
}

const DEFAULT_FORM: FormState = {
  academic_year: '2025/26',
  year: 1,
  term: 'michaelmas',
  week: 1,
  module_code: '',
  module_title: '',
  kind: 'lecture',
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  title: '',
  notes: '',
  apply_scope: 'mine',
  consent_affects_all: false,
}

export default function ContributeTool() {
  const { session } = useContext(AuthContext)
  const [userId, setUserId] = useState<string>('')
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok'|'warn'|'err', text: string }|null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const supabase = getBrowserSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) setUserId(user.id)
      } catch {}
    })()
  }, [])

  const isSignedIn = !!(session?.user?.id || userId)

  const canSubmit = useMemo(() => {
    if (!isSignedIn) return false
    if (!form.module_code && !form.module_title) return false
    if (!form.date || !form.start_time || !form.end_time) return false
    if (form.apply_scope === 'cohort' && !form.consent_affects_all) return false
    return true
  }, [isSignedIn, form])

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setMessage(null)
  }

  async function submitNow() {
    setSubmitting(true)
    setMessage(null)
    try {
      // Ensure module_code is a string (the helper expects string).
      const safeModuleCode = (form.module_code || '').toUpperCase()

      const result = await addStudentTopic({
        userId: userId || session?.user?.id || '',
        year: form.year,
        term: form.term,
        week: form.week,
        module_code: safeModuleCode, // <-- string enforced
        day: new Date(form.date).toLocaleDateString('en-GB', { weekday: 'short' }) as any,
        title: form.title || `${form.kind.toUpperCase()} · ${(form.module_title || safeModuleCode)}`,
        notes: [
          form.notes,
          form.location ? `Location: ${form.location}` : '',
          form.start_time && form.end_time ? `Time: ${form.start_time}-${form.end_time}` : '',
          `(Submitted via Contribute • Scope: ${form.apply_scope})`
        ].filter(Boolean).join('\n')
      })

      if (result?.ok) {
        setMessage({ tone: 'ok', text: form.apply_scope === 'cohort'
          ? 'Thank you. Your update was submitted and flagged for cohort-wide review.'
          : 'Saved to your personal calendar. You can revise it any time.' })
        setForm(DEFAULT_FORM)
      } else {
        setMessage({ tone: 'err', text: 'Could not save your update right now.' })
      }
    } catch (e: any) {
      setMessage({ tone: 'err', text: e?.message || 'Unexpected error.' })
    } finally {
      setSubmitting(false)
      setConfirmOpen(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.apply_scope === 'cohort') setConfirmOpen(true)
    else submitNow()
  }

  const preview = useMemo(() => ({
    academic_year: form.academic_year,
    year: form.year,
    term: form.term,
    week: form.week,
    module_code: (form.module_code || '').toUpperCase(),
    module_title: form.module_title || undefined,
    kind: form.kind,
    date: form.date,
    start_time: form.start_time,
    end_time: form.end_time,
    location: form.location || undefined,
    title: form.title || `${form.kind.toUpperCase()} · ${(form.module_title || (form.module_code || '').toUpperCase())}`,
    notes: form.notes || undefined,
    apply_scope: form.apply_scope,
    consent_affects_all: form.consent_affects_all,
    submitted_at: format(new Date(), 'yyyy-MM-dd HH:mm'),
  }), [form])

  return (
    <>
      <Head><title>Contribute corrections • Tools • MyDurhamLaw</title></Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold">Contribute a correction / update</h1>
              <p className="text-xs md:text-sm text-gray-600">Help keep your timetable & syllabus accurate.</p>
            </div>
            <div className="space-x-2">
              <Link href="/year-at-a-glance"><Button>Back to YAAG</Button></Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid md:grid-cols-2 gap-8">
          {/* Left: form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 md:p-6 space-y-4">
            {!isSignedIn && (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 text-sm">
                Please sign in to submit corrections.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Academic Year</Label>
                <Select value={form.academic_year} onChange={e => updateForm('academic_year', e.target.value)}>
                  <option value="2024/25">2024/25</option>
                  <option value="2025/26">2025/26</option>
                  <option value="2026/27">2026/27</option>
                </Select>
              </div>
              <div>
                <Label>Year of Study</Label>
                <Select value={String(form.year)} onChange={e => updateForm('year', Number(e.target.value))}>
                  <option value="0">Foundation</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Term</Label>
                <Select value={form.term} onChange={e => updateForm('term', e.target.value as any)}>
                  <option value="michaelmas">Michaelmas</option>
                  <option value="epiphany">Epiphany</option>
                  <option value="easter">Easter</option>
                </Select>
              </div>
              <div>
                <Label>Teaching Week</Label>
                <Input type="number" min={1} max={12} value={form.week} onChange={e => updateForm('week', Number(e.target.value))} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.kind} onChange={e => updateForm('kind', e.target.value as EventKind)}>
                  <option value="lecture">Lecture</option>
                  <option value="seminar">Seminar</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="assessment">Assessment</option>
                  <option value="exam">Exam</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Module Code</Label>
                <Input
                  placeholder="e.g., LAW1051"
                  value={form.module_code}
                  onChange={e => updateForm('module_code', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label>Module Title</Label>
                <Input
                  placeholder="Optional"
                  value={form.module_title}
                  onChange={e => updateForm('module_title', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start</Label>
                  <Input type="time" value={form.start_time} onChange={e => updateForm('start_time', e.target.value)} />
                </div>
                <div>
                  <Label>End</Label>
                  <Input type="time" value={form.end_time} onChange={e => updateForm('end_time', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Input placeholder="e.g., PCL050" value={form.location} onChange={e => updateForm('location', e.target.value)} />
              </div>
              <div>
                <Label>Custom Title (optional)</Label>
                <Input placeholder="Overrides default title" value={form.title} onChange={e => updateForm('title', e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea rows={4} placeholder="Context, source, lecturer email, etc." value={form.notes} onChange={e => updateForm('notes', e.target.value)} />
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Label className="m-0">Apply scope</Label>
                <label className="inline-flex items-center gap-2 text-sm mr-4">
                  <input
                    type="radio"
                    name="scope"
                    checked={form.apply_scope === 'mine'}
                    onChange={() => updateForm('apply_scope', 'mine')}
                  />
                  <span>Only my calendar</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="scope"
                    checked={form.apply_scope === 'cohort'}
                    onChange={() => updateForm('apply_scope', 'cohort')}
                  />
                  <span>Propose cohort-wide update</span>
                </label>
              </div>

              {form.apply_scope === 'cohort' && (
                <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                  <div className="font-medium mb-1">Important:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your submission will be flagged for moderation.</li>
                    <li>If approved, it may update the timetable/syllabus for your cohort.</li>
                  </ul>
                  <label className="mt-2 inline-flex items-center gap-2">
                    <Checkbox
                      checked={form.consent_affects_all}
                      onChange={e => updateForm('consent_affects_all', e.target.checked)}
                    />
                    <span>I understand and consent to propose this change for my cohort.</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="solid" disabled={!canSubmit || submitting}>
                {submitting ? 'Submitting…' : (form.apply_scope === 'cohort' ? 'Submit for review' : 'Save to my calendar')}
              </Button>
              <Link href="/year-at-a-glance"><Button type="button">Cancel</Button></Link>
            </div>

            {message && (
              <div
                className={`mt-2 text-sm rounded-md border p-2 ${
                  message.tone === 'ok'
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : message.tone === 'warn'
                    ? 'border-yellow-300 bg-yellow-50 text-yellow-900'
                    : 'border-red-300 bg-red-50 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}
          </form>

          {/* Right: preview */}
          <div className="bg-white rounded-xl border p-4 md:p-6">
            <h3 className="text-base font-semibold mb-2">Preview</h3>
            <p className="text-sm text-gray-600 mb-3">This is what we'll store with your submission.</p>
            <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto border">
{JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Confirmation for cohort submissions */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5 border">
            <h3 className="text-lg font-semibold">Confirm cohort-wide submission</h3>
            <p className="text-sm text-gray-600 mt-2">
              You're proposing a change that may update the timetable/syllabus for other students once approved.
              Continue?
            </p>

            <div className="mt-4 space-y-2 text-sm bg-gray-50 p-3 rounded border">
              <div><b>Module:</b> {form.module_title || (form.module_code || '').toUpperCase() || '-'}</div>
              <div><b>Type:</b> {form.kind}</div>
              <div><b>Date:</b> {form.date || '-'} &nbsp; <b>Time:</b> {form.start_time || '--:--'}-{form.end_time || '--:--'}</div>
              {form.location && <div><b>Location:</b> {form.location}</div>}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={submitNow} variant="solid" disabled={submitting || !form.consent_affects_all}>
                {submitting ? 'Submitting…' : 'Yes, submit for review'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
