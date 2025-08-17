# MyDurhamLaw Onboarding System

## Overview
The onboarding system provides a comprehensive orientation-style experience for new Durham Law students, guiding them through document uploads and academic goal setting to personalize their AI study companion.

## Features

### 🎉 Welcome Experience
- Branded welcome message with MyDurhamLaw logo
- Professional orientation-style interface
- Progress tracking with visual indicators

### 📁 Document Upload System
**Required Documents:**
1. **Course Syllabus** (PDF/DOC) - Core curriculum information
2. **Weekly Timetable** - Class schedule and timing
3. **Assignment Deadlines** - Coursework and assignment info
4. **Exam Timetable** - Examination schedule

**Optional Documents:**
5. **Reading List** - Supplementary materials

### 🗃️ Supabase Integration
- **Storage**: Documents stored in `onboarding-uploads/{userId}/` bucket
- **Database**: Progress tracked in `profiles` table with:
  - `onboarding_status`: 'incomplete' | 'partial' | 'complete'
  - `uploaded_docs`: JSON array of document metadata
  - `academic_goal`: User-selected academic target
  - `syllabus_summary`: AI-generated summary (optional)

### 🎯 Academic Goals
Students can select from:
- **Pass** (40%+): Complete the degree successfully
- **2:2** (50-59%): Lower second-class honours
- **2:1** (60-69%): Upper second-class honours
- **First Class** (70%+): Highest undergraduate classification

### 🛡️ Security & Authentication
- Authentication required via AuthContext
- RLS policies for user-specific document access
- Secure file upload with validation

## File Structure
```
src/pages/onboarding/
├── OnboardingPage.tsx     # Main onboarding component
├── index.tsx              # Route redirect
└── README.md              # This documentation

src/lib/supabase/
└── onboardingSchema.sql   # Database schema
```

## Usage

### Accessing Onboarding
- Route: `/onboarding` or `/onboarding/OnboardingPage`
- Requires authentication (redirects to `/login` if not authenticated)
- Auto-redirects to dashboard if already completed

### Integration with Durmah AI
- Optional AI assistant integration for guidance
- Voice mode support (if available)
- Friendly nudges and help prompts

### Progress Flow
1. **Welcome** → Document uploads (5 steps)
2. **File Processing** → Supabase storage + metadata
3. **Academic Goals** → Goal selection and saving
4. **Completion** → Success badge + dashboard redirect

## Database Schema
Run the SQL in `src/lib/supabase/onboardingSchema.sql` to set up:
- Profile table columns for onboarding data
- Storage bucket and RLS policies
- Indexes for performance

## Testing
The system includes comprehensive error handling and loading states for:
- File upload failures
- Network connectivity issues
- Authentication errors
- Database operation failures

## API Integration
- Uses existing Supabase client and AuthContext
- File uploads via Supabase Storage API
- Profile updates via Supabase database API
- Real-time progress tracking

## Responsive Design
- Mobile-friendly interface
- Progressive enhancement
- Tailwind CSS styling matching app theme
- Loading states and progress indicators

---

**Status**: ✅ Production Ready
**Last Updated**: August 2025
**Maintainer**: MyDurhamLaw Development Team