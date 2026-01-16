import React from 'react'
import { Video, Phone, Copy, Check, X, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Connection {
  id: string
  displayName: string
  isAvailable?: boolean // Added optional prop
  whatsapp_e164?: string
  phone_e164?: string
  facetime_contact?: string
  google_meet_url?: string
  preferred_channel?: 'whatsapp' | 'facetime' | 'meet' | 'phone'
}

interface ConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  connection: Connection
}

export default function ConnectModal({ isOpen, onClose, onEdit, connection }: ConnectModalProps) {
  const [copied, setCopied] = React.useState<string | null>(null)
  
  // ... existing code ...

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-6 text-white text-center relative ${connection.isAvailable ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gray-800'}`}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white text-xs font-semibold px-3"
              >
                Edit
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 text-2xl font-bold">
            {connection.displayName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold">Connect with {connection.displayName}</h2>
          <p className="text-white/80 text-sm mt-1">
            {connection.isAvailable ? "Choose how you'd like to reach out" : "They are currently offline, but you can leave a message."}
          </p>
        </div>

        {!connection.isAvailable && (
           <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 flex items-center justify-center text-center">
              <p className="text-xs text-orange-800 font-medium">
                 ⚠️ User is away / busy. They might not answer immediately.
              </p>
           </div>
        )}

        <div className="p-6 space-y-3">
          {options.map((opt) => (
            <div key={opt.id} className="relative group">
              <button
                onClick={opt.action}
                className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 shadow-sm active:scale-[0.98] ${opt.color} ${opt.textColor || 'text-white'}`}
              >
                <opt.icon size={20} />
                {opt.label}
              </button>
              
              {opt.secondary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    opt.secondary!.action()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
                  title="Copy"
                >
                  {copied === opt.id ? <Check size={16} className="text-green-500" /> : <opt.secondary.icon size={16} />}
                </button>
              )}
              
              {opt.note && (
                <div className="text-center mt-1 text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                  {opt.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
