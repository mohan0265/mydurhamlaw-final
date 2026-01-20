import React, { useState } from 'react'
import { SupportChat } from './SupportChat'
import { MessageCircle } from 'lucide-react'

export function SupportWidget() {
  const [open, setOpen] = useState(false)

  return (
    // Z-index order: SupportWidget (40) < Durmah closed (50) < AWY closed (55) < Durmah open (45) << AWY open (65)
    /* NUCLEAR REMOVAL: Widget redundant. Returning null. */
    null
  )
}
