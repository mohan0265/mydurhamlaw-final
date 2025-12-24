import React, { useState } from 'react'
import { SupportChat } from './SupportChat'
import { MessageCircle } from 'lucide-react'

export function SupportWidget() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-6 bottom-36 z-[55] flex flex-col items-end">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-2xl"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">Need help?</div>
            <div className="text-[11px] text-white/80">Durmah-Support</div>
          </div>
        </button>
      )}

      {open && (
        <div className="w-96 max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Durmah-Support</div>
              <div className="text-[11px] text-white/80">Questions, billing, voice/mic, YAAG, more</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
          </div>
          <div className="p-4 bg-slate-50 border-t">
            <SupportChat compact />
          </div>
        </div>
      )}
    </div>
  )
}
