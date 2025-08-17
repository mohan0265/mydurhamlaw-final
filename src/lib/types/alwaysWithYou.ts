// Types for "Always With You" video calling feature

export interface LovedOne {
  email: string
  relationship: string // "Mum", "Dad", "Guardian", "Partner", etc.
  display_name: string
  is_online?: boolean
  last_seen?: string
  status?: 'available' | 'busy' | 'offline'
}

export interface StudentSharingSettings {
  show_live_status_to_parents: boolean
  share_today_calendar: boolean
  share_custom_notes: boolean
  do_not_disturb: boolean
  quiet_hours_start?: string // "22:00"
  quiet_hours_end?: string   // "08:00"
}

export interface CustomUpdate {
  id: string
  message: string
  type: 'note' | 'plan' | 'mood' | 'achievement'
  timestamp: string
  visible_to_parents: boolean
}

export interface StudentProfile {
  id: string
  parent1_email?: string
  parent1_relationship?: string
  parent1_display_name?: string
  parent2_email?: string
  parent2_relationship?: string
  parent2_display_name?: string
  sharing_settings: StudentSharingSettings
  custom_updates: CustomUpdate[]
  is_online?: boolean
  last_seen?: string
  current_activity?: string // "Studying Contract Law", "In Lecture", etc.
}

export interface VideoCallSession {
  id: string
  student_id: string
  parent_email: string
  status: 'initiating' | 'ringing' | 'active' | 'ended'
  started_at: string
  ended_at?: string
  duration?: number
  created_at?: string
  metadata?: any
}

export interface PresenceData {
  user_id: string
  is_online: boolean
  last_seen: string
  current_page?: string
  activity?: string
}

// Default sharing settings for new students
export const DEFAULT_SHARING_SETTINGS: StudentSharingSettings = {
  show_live_status_to_parents: true,
  share_today_calendar: true,
  share_custom_notes: true,
  do_not_disturb: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00"
}