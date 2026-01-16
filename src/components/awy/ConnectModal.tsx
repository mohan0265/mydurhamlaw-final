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
  
  const copyToClipboard = (text: string, label: string, message: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(message)
    setTimeout(() => setCopied(null), 2000)
  }

  const getWhatsAppLink = (number: string) => {
    const clean = number.replace(/\D/g, '')
    // Use wa.me which works for both desktop and web
    return `https://wa.me/${clean}`
  }

  const getFaceTimeLink = (contact: string, video: boolean = true) => {
    return video ? `facetime://${contact}` : `facetime-audio://${contact}`
  }

  // Determine order based on availability and preference
  const options = []

  // 1. WhatsApp
  if (connection.whatsapp_e164) {
    options.push({
      id: 'whatsapp',
      label: 'WhatsApp Chat',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#128C7E]',
      action: () => window.open(getWhatsAppLink(connection.whatsapp_e164!), '_blank'),
      secondary: {
        icon: Copy,
        action: () => copyToClipboard(connection.whatsapp_e164!, 'whatsapp', 'Copied WhatsApp number')
      }
    })
  } else if (onEdit) {
    options.push({
      id: 'whatsapp-add',
      label: 'Add WhatsApp',
      icon: MessageCircle,
      color: 'bg-gray-50 text-gray-400 border border-gray-200 border-dashed hover:bg-gray-100 hover:text-gray-600',
      textColor: 'text-gray-400',
      action: onEdit,
      note: 'Click to add number'
    })
  }

  // 2. FaceTime
  if (connection.facetime_contact) {
    options.push({
      id: 'facetime',
      label: 'FaceTime Video',
      icon: Video,
      color: 'bg-black hover:bg-gray-800',
      action: () => window.location.href = getFaceTimeLink(connection.facetime_contact!),
      note: 'Apple devices only',
      secondary: {
        icon: Copy,
        action: () => copyToClipboard(connection.facetime_contact!, 'facetime', 'Copied FaceTime contact')
      }
    })
  } else if (onEdit) {
    options.push({
      id: 'facetime-add',
      label: 'Add FaceTime',
      icon: Video,
      color: 'bg-gray-50 text-gray-400 border border-gray-200 border-dashed hover:bg-gray-100 hover:text-gray-600',
      textColor: 'text-gray-400',
      action: onEdit,
      note: 'Click to add contact'
    })
  }

  // 3. Google Meet
  if (connection.google_meet_url) {
    options.push({
      id: 'meet',
      label: 'Google Meet',
      icon: Video,
      color: 'bg-[#1a73e8] hover:bg-[#1557b0]',
      action: () => window.open(connection.google_meet_url!, '_blank'),
      secondary: {
        icon: Copy,
        action: () => copyToClipboard(connection.google_meet_url!, 'meet', 'Copied Meet link')
      }
    })
  } else {
    // Always offer a "Create New Meet" option if no specific URL
    options.push({
      id: 'meet-new',
      label: 'Start Google Meet',
      icon: Video,
      color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
      textColor: 'text-gray-700',
      action: () => window.open('https://meet.google.com/new', '_blank'),
      note: 'Opens new meeting room',
      secondary: {
        icon: Copy,
        action: () => copyToClipboard('https://meet.google.com/new', 'meet-new', 'Copied Meet link')
      }
    })
  }

  // 4. Phone
  if (connection.phone_e164) {
    const number = connection.phone_e164
    options.push({
      id: 'phone',
      label: 'Call Number',
      icon: Phone,
      color: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      textColor: 'text-gray-900',
      action: () => window.location.href = `tel:${number}`,
      secondary: {
        icon: Copy,
        action: () => copyToClipboard(number!, 'phone', 'Copied phone number')
      }
    })
  }

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
