#!/bin/bash

# List of files to update
files=(
  "src/components/alwaysWithYou/AlwaysWithYouWidget.tsx"
  "src/components/FeedbackForm.tsx"
  "src/components/layout/ModernSidebar.tsx"
  "src/components/layout/ResponsiveSidebar.tsx"
  "src/components/podcast/TodayPodcastsCard.tsx"
  "src/components/onboarding/OnboardingReminder.tsx"
  "src/components/onboarding/OnboardingGate.tsx"
  "src/components/academic/YearSelectionPrompt.tsx"
  "src/components/integrity/IntegrityPledge.tsx"
  "src/components/integrity/DisclosureBanner.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    # Replace the import statement
    sed -i 's/import { supabase } from '\''@\/lib\/supabase\/client'\''/import { getSupabaseClient } from '\''@\/lib\/supabase\/client'\''/g' "$file"
  fi
done

echo "Import statements updated. Now need to update function calls manually."
