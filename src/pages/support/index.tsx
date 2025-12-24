import Head from 'next/head'
import { SupportChat } from '@/components/support/SupportChat'
import { MessageCircle } from 'lucide-react'

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Support - MyDurhamLaw</title>
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support</h1>
            <p className="text-slate-600 text-sm">Chat with Durmah-Support, browse quick fixes, and open a ticket.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <SupportChat />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Common topics</h2>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>• Login issues (Google OAuth)</li>
              <li>• Trial activation / Free • Inactive</li>
              <li>• Billing / subscription / cancel</li>
              <li>• Mic permissions for voice</li>
              <li>• YAAG not visible after login</li>
              <li>• Durmah widget “not listening”</li>
              <li>• Mobile vs desktop tips</li>
            </ul>
            <p className="text-xs text-slate-500 mt-4">
              If the chat cannot resolve it, we’ll escalate to a human and keep you posted via this thread.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
