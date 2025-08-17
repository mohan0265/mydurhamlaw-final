// src/components/community/DiningSection.tsx
import { useState, useEffect } from 'react'

interface Eatery {
  id: string
  name: string
  cuisine: string
  price: string
  hours: string
  rating: number
  link: string
}

const fetchEateries = async (): Promise<Eatery[]> => {
  // Simulate API call — replace with OpenTable or Zomato API
  return [
    {
      id: 'tandoori-palace',
      name: 'Tandoori Palace',
      cuisine: 'Indian • Halal',
      price: '££',
      hours: '12pm–11pm',
      rating: 4.7,
      link: 'https://www.opentable.com/restref/client/?restId=28234&ref=123',
    },
    {
      id: 'flat-white',
      name: 'Flat White',
      cuisine: 'Café • Vegan Options',
      price: '£',
      hours: '8am–6pm',
      rating: 4.8,
      link: 'https://resy.com/cities/uk-durham-flat-white',
    },
  ]
}

export default function DiningSection() {
  const [data, setData] = useState<Eatery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const eateries = await fetchEateries()
        setData(eateries)
        setError(null)
      } catch (err) {
        setError('Failed to load dining options')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) return <div className="text-center py-4">Loading restaurants...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <section id="eat" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {data.map(venue => (
        <div key={venue.id} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition border">
          <h3 className="text-xl font-bold text-gray-900">{venue.name}</h3>
          <p className="text-gray-600 mt-1">{venue.cuisine}</p>
          <p className="text-amber-600 font-medium mt-1">{venue.price}</p>
          <p className="text-sm text-gray-500">{venue.hours}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-yellow-500">⭐ {venue.rating}</span>
            <a
              href={venue.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Book Now →
            </a>
          </div>
        </div>
      ))}
    </section>
  )
}