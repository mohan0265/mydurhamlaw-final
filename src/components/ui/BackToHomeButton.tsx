import Link from 'next/link'
import { Home } from 'lucide-react'

export default function BackToHomeButton() {
  return (
    <Link 
      href="/" 
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600 text-sm font-medium"
      title="Back to Home"
    >
      <Home className="w-4 h-4" />
      <span className="hidden sm:inline">Back to Home</span>
    </Link>
  )
}