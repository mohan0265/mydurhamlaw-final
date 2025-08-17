'use client'

import { useState } from 'react'
// import { useQuery } from 'react-query' // Removed for simplicity
import HeroSection from '@/components/community/HeroSection'
import CategoryTabs from '@/components/community/CategoryTabs'
import DiningSection from '@/components/community/DiningSection'
import EventsCarousel from '@/components/community/EventsCarousel'
import MapSection from '@/components/community/MapSection'
import ParentEssentials from '@/components/community/ParentEssentials'
import useUserType from '@/lib/hooks/useUserType'
import { useBookmarks } from '@/lib/hooks/useBookmarks'

// 🔧 Placeholder components for missing sections — you can replace these later
const GrocerySection = () => <div className="p-4 text-center text-gray-500">Grocery section coming soon.</div>
const TravelPlanner = () => <div className="p-4 text-center text-gray-500">Travel planner launching soon.</div>
const DeliveryWidget = () => <div className="p-4 text-center text-gray-500">Delivery widget in progress.</div>
const WellbeingCard = () => <div className="p-4 text-center text-gray-500">Wellbeing support coming soon.</div>

export default function CommunityHub() {
  const [activeTab, setActiveTab] = useState('eat')
  const userType = useUserType()
  const { data: bookmarks, loading: bookmarksLoading } = useBookmarks()

  const tabs = [
    { value: 'eat', label: '🍽️ Eat', component: <DiningSection /> },
    { value: 'events', label: '🎉 Events', component: <EventsCarousel /> },
    { value: 'map', label: '🧭 Map', component: <MapSection /> },
    { value: 'groceries', label: '🛒 Essentials', component: <GrocerySection /> },
    { value: 'travel', label: '✈️ Travel', component: <TravelPlanner /> },
    { value: 'deliver', label: '📦 Deliver', component: <DeliveryWidget /> },
    { value: 'wellbeing', label: '🧘‍♀️ Wellbeing', component: <WellbeingCard /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />

      {userType === 'parent' && <ParentEssentials />}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <CategoryTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="mt-8">
          {tabs.find(t => t.value === activeTab)?.component}
        </main>
      </div>

      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p>© 2025 MyDurhamLaw | Built for Durham Law Students & Families</p>
      </footer>
    </div>
  )
}
