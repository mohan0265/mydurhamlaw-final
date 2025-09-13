
// Utility for handling signup metadata storage and retrieval
export interface SignupMetadata {
  display_name: string
  year_group: 'foundation' | 'year1' | 'year2' | 'year3'
  user_type: 'foundation' | 'year1' | 'year2' | 'year3'
  agreed_to_terms: boolean
}

export const storeSignupMetadata = (metadata: SignupMetadata): void => {
  try {
    // Store in localStorage for persistence across redirects
    localStorage.setItem('signup_metadata', JSON.stringify(metadata))
    
    // Also store individual items for backward compatibility
    localStorage.setItem('temp_year_group', metadata.year_group)
    localStorage.setItem('temp_display_name', metadata.display_name)
    
    console.log('✅ Signup metadata stored:', metadata)
  } catch (error) {
    console.error('❌ Failed to store signup metadata:', error)
  }
}

export const retrieveSignupMetadata = (): SignupMetadata | null => {
  try {
    // Try to get the complete metadata object first
    const storedMetadata = localStorage.getItem('signup_metadata')
    if (storedMetadata) {
      const parsed = JSON.parse(storedMetadata) as SignupMetadata
      console.log('✅ Retrieved complete signup metadata:', parsed)
      return parsed
    }

    // Fallback to individual items
    const yearGroup = localStorage.getItem('temp_year_group') as SignupMetadata['year_group']
    const displayName = localStorage.getItem('temp_display_name')
    
    if (yearGroup && displayName) {
      const fallbackMetadata: SignupMetadata = {
        display_name: displayName,
        year_group: yearGroup,
        user_type: yearGroup,
        agreed_to_terms: true
      }
      console.log('✅ Retrieved fallback signup metadata:', fallbackMetadata)
      return fallbackMetadata
    }

    console.log('❌ No signup metadata found')
    return null
  } catch (error) {
    console.error('❌ Failed to retrieve signup metadata:', error)
    return null
  }
}

export const clearSignupMetadata = (): void => {
  try {
    localStorage.removeItem('signup_metadata')
    localStorage.removeItem('temp_year_group')
    localStorage.removeItem('temp_display_name')
    
    // Clean up any legacy sessionStorage items
    sessionStorage.removeItem('year_group')
    sessionStorage.removeItem('user_type')
    sessionStorage.removeItem('display_name')
    sessionStorage.removeItem('agreed_to_terms')
    sessionStorage.removeItem('signup_data')
    
    console.log('✅ Signup metadata cleared')
  } catch (error) {
    console.error('❌ Failed to clear signup metadata:', error)
  }
}

export const getDashboardRoute = (yearGroup: string): string => {
  // All year groups now use the same unified dashboard
  switch (yearGroup) {
    case 'foundation':
    case 'year1':
    case 'year2':
    case 'year3':
      return '/dashboard'
    default:
      console.error('🚨 Invalid year group:', yearGroup)
      return '/signup'
  }
}
