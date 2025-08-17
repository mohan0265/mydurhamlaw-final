// src/components/community/EventsCarousel.tsx
import { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

interface EventItem {
  id: number
  title: string
  date: string
  loc: string
  link: string
}

const fetchEvents = async (): Promise<EventItem[]> => {
  // Replace with Eventbrite or Durham Uni API
  return [
    { id: 1, title: 'Durham Lumiere Festival', date: 'Nov 15–18', loc: 'City Centre', link: '#' },
    { id: 2, title: 'Law Society Ball', date: 'Dec 5', loc: 'Durham Castle', link: '#' },
    { id: 3, title: 'Christmas Market', date: 'Dec 1–22', loc: 'Market Place', link: '#' },
  ]
}

export default function EventsCarousel() {
  const [data, setData] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventData = await fetchEvents()
        setData(eventData)
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadEvents()
  }, [])

  if (isLoading) return <p>Loading events...</p>

  return (
    <section className="py-6">
      <h2 className="text-2xl font-bold mb-4">🎉 Upcoming Events</h2>
      <Swiper spaceBetween={16} slidesPerView={1.2} loop>
        {data.map(event => (
          <SwiperSlide key={event.id} className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-bold text-lg">{event.title}</h3>
            <p className="text-blue-600 font-medium">{event.date}</p>
            <p className="text-gray-600 text-sm mt-1">{event.loc}</p>
            <a href={event.link} className="text-sm text-blue-500 hover:underline block mt-3">
              Learn More →
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}