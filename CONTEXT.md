# CONTEXT.md — Claude Session Context for DurhamLaw App (Aug 4, 2025)

🧠 PROJECT: DurhamLaw App – AI-powered legal study assistant for Durham University law students  
📁 Root Folder: C:\Users\M Chandramohan\OneDrive\1MyDurhamLaw-2.0\DurhamLawFixed-1Aug345am  
🛠️ Tech Stack: Next.js 14, TypeScript, Supabase, Tailwind, OpenAI GPT-4o  

🎯 CURRENT MODULE IN FOCUS:
✅ Orientation & Onboarding Flow (Status: Implemented)  
📄 File: `src/pages/onboarding/OnboardingPage.tsx`  
📍 Menu Access: `/onboarding/OnboardingPage` under “Study Resources”  
🟪 Features:
- Academic document uploads (syllabus, timetable, exam dates)
- Optional entries: course handbook, pro bono interests, DELSA links
- Progress tracker (e.g., “60% Onboarded” badge)
- `onboarding_status`, `onboarding_progress`, and `documents_uploaded` stored in Supabase `profiles` table
- Dashboard personalization logic pending

📌 CLAUDE TASKS NEXT:
1. Integrate AI dashboard widgets **after onboarding is complete**
2. Personalize app based on uploaded data (modules, timetable, goals)
3. Add onboarding logic to `/dashboard/` and `/signup/` flows (if not already linked)
4. Final polish of header + sidebar links
5. Track key metrics (drop-off points, upload failures, goal completion %)

📂 Available Context Files:
- `CLAUDE.md`: Long-term app structure and instructions
- `CONTEXT.md`: Short-term thread memory starter (this file)

✅ Current Claude CLI Mode: Claude 3.5 / Opus, auto-edit mode ON  
