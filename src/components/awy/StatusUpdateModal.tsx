import React, { useState } from 'react'
import { X, Clock, Check, MessageSquare, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface StatusUpdateModalProps {
  currentStatus: 'available' | 'busy' | 'dnd'
  currentNote: string | null
  onUpdate: (status: 'available' | 'busy' | 'dnd', note: string | null, expiryMinutes: number | null) => Promise<void>
  onClose: () => void
}

export function StatusUpdateModal({ currentStatus, currentNote, onUpdate, onClose }: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<'available' | 'busy' | 'dnd'>(currentStatus === 'busy' ? 'busy' : 'available')
  const [note, setNote] = useState(currentNote || '')
  const [expiry, setExpiry] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onUpdate(selectedStatus, note.trim() || null, expiry)
      onClose()
    } catch (error) {
       console.error(error)
       // Toast handled by parent usually, but just in case
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { id: 'available', label: 'Available', color: 'bg-green-100 text-green-700 ring-green-500', icon: '👋' },
    { id: 'busy', label: 'Busy', color: 'bg-orange-100 text-orange-700 ring-orange-500', icon: '⚡' }
  ] as const

  const expiryOptions = [
    { label: '30 mins', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '4 hours', value: 240 },
    { label: 'Until I change it', value: null },
  ]

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Set Status</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          {/* Status Selection */}
          <div className="grid grid-cols-2 gap-3">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedStatus(opt.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  selectedStatus === opt.id 
                    ? `border-transparent ring-2 ${opt.color} bg-opacity-70 dark:bg-opacity-70` 
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                } ${selectedStatus === opt.id ? opt.color.split(' ')[0] : ''}`}
              >
                <span className="text-xl mb-1">{opt.icon}</span>
                <span className={`text-xs font-bold ${selectedStatus === opt.id ? 'opacity-100' : 'text-gray-500'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          {/* Note Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 50))}
              placeholder="e.g. Studying Contracts..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            />
            <div className="text-right text-[10px] text-gray-400">
              {note.length}/50
            </div>
          </div>

          {/* Expiry Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3" /> Clear After
            </label>
            <div className="grid grid-cols-2 gap-2">
              {expiryOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setExpiry(opt.value)}
                  className={`text-xs py-2 px-3 rounded-lg border transition-all ${
                    expiry === opt.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" /> Update Status
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}
