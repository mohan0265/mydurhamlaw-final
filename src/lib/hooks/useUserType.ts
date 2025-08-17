// src/lib/hooks/useUserType.ts
import { useEffect, useState } from 'react'

export default function useUserType() {
  const [userType, setUserType] = useState<'student' | 'parent' | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('userType')
    if (saved) {
      setUserType(saved as any)
    } else {
      // Default heuristic
      const isParent = window.location.search.includes('parent=true')
      setUserType(isParent ? 'parent' : 'student')
    }
  }, [])

  return userType
}