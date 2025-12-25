import { useEffect, useState } from 'react'
import Head from 'next/head'
import toast from 'react-hot-toast'

type KB = { id?: string; title: string; slug: string; body: string; tags: string[]; is_published: boolean }

export default function AdminKB() {
  const [articles, setArticles] = useState<KB[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    fetch('/.netlify/functions/support-kb-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' })
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || 'Failed')
        setArticles(json.results || [])
      })
      .catch((e) => setError(e?.message || 'Failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const saveArticle = async (k: KB) => {
    const res = await fetch('/.netlify/functions/support-kb-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', article: k })
    })
    const json = await res.json()
    if (!json.ok) toast.error(json.error || 'Save failed')
    else {
      toast.success('Saved')
      load()
    }
  }

  const togglePublished = (k: KB) => saveArticle({ ...k, is_published: !k.is_published })

  const addNew = () => {
    setArticles((prev) => [
      { id: undefined, title: 'New Article', slug: `kb-${Date.now()}`, body: '', tags: [], is_published: false },
      ...prev
    ])
  }

  return (
    <>
      <Head><title>Admin KB - MyDurhamLaw</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">KB Articles</h1>
          <button onClick={addNew} className="px-3 py-2 rounded bg-purple-600 text-white text-sm">Add New</button>
        </div>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {loading && <div className="text-sm text-slate-500 mb-2">Loading…</div>}
        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.id || a.slug} className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <input
                  value={a.title}
                  onChange={(e) => setArticles((prev) => prev.map((p) => p.slug === a.slug ? { ...p, title: e.target.value } : p))}
                  className="font-semibold text-slate-900 border-b border-slate-200 flex-1 mr-2"
                />
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input type="checkbox" checked={a.is_published} onChange={() => togglePublished(a)} />
                  Published
                </label>
              </div>
              <div className="text-xs text-slate-500 mb-1">
                Slug:
                <input
                  value={a.slug}
                  onChange={(e) => setArticles((prev) => prev.map((p) => p.slug === a.slug ? { ...p, slug: e.target.value } : p))}
                  className="border rounded px-2 py-1 text-xs ml-1"
                />
              </div>
              <textarea
                value={a.body}
                onChange={(e) => setArticles((prev) => prev.map((p) => p.slug === a.slug ? { ...p, body: e.target.value } : p))}
                className="w-full border rounded px-2 py-1 text-sm mb-2" rows={4}
              />
              <input
                value={a.tags?.join(',') || ''}
                onChange={(e) => setArticles((prev) => prev.map((p) => p.slug === a.slug ? { ...p, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : p))}
                className="w-full border rounded px-2 py-1 text-sm mb-2"
                placeholder="tags comma sep"
              />
              <button
                onClick={() => saveArticle(a)}
                className="px-3 py-2 rounded bg-slate-800 text-white text-sm"
              >
                Save
              </button>
            </div>
          ))}
          {!loading && articles.length === 0 && (
            <div className="text-sm text-slate-500">No KB articles.</div>
          )}
        </div>
      </div>
    </>
  )
}
