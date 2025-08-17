// src/components/FloatingDurmah.tsx
export default function FloatingDurmah() {
  // Toggle with env if needed
  if (process.env.NEXT_PUBLIC_ENABLE_VOICE_FEATURES !== 'true') return null
  return (
    <button
      aria-label="Open Durmah Buddy"
      className="fixed bottom-6 left-6 z-50 rounded-full shadow-lg px-4 py-3 bg-purple-600 text-white hover:bg-purple-700"
    >
      💬 Durmah
    </button>
  )
}