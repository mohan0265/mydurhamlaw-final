// src/components/community/ParentEssentials.tsx
export default function ParentEssentials() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 mb-8 rounded-r-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">For Parents & Families</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold">📅 Term Dates</h3>
          <p className="text-sm text-gray-700">Michaelmas: Oct 5 – Dec 4 • Lent: Jan 10 – Mar 15</p>
        </div>
        <div>
          <h3 className="font-semibold">🏨 Approved Hotels</h3>
          <p className="text-sm text-gray-700">Radisson Blu, Premier Inn, Jurys Inn</p>
        </div>
        <div>
          <h3 className="font-semibold">🚗 Airport Transfers</h3>
          <p className="text-sm text-gray-700">Excel Taxis, Uber, National Express</p>
        </div>
        <div>
          <h3 className="font-semibold">🍽️ Family-Friendly Eats</h3>
          <p className="text-sm text-gray-700">Prezzo, The Botanic, Ask Italian</p>
        </div>
      </div>
    </div>
  )
}