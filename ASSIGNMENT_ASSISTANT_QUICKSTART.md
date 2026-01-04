# Assignment Assistant - Quick Start Guide

## 🚀 Deployment Steps

### 1. Add Environment Variables (Netlify)

```bash
OPENAI_API_KEY=sk-...
# Optional
GEMINI_API_KEY=...
ASSIGNMENT_AI_PROVIDER=openai
```

### 2. Run Database Migration

In Supabase SQL Editor:
```sql
-- Run: supabase/migrations/20260103_assignment_assistant.sql
```

### 3. Create Storage Bucket

Supabase Dashboard → Storage → New Bucket:
- Name: `assignments`
- Public: `false`
- Policy: Authenticated users can upload

### 4. Deploy

```bash
git add .
git commit -m "feat: Add AI-Powered Assignment Assistant with 6-stage workflow"
git push origin main
```

Netlify will auto-deploy.

## ✅ Verify Deployment

1. Navigate to `/assignments`
2. Create test assignment
3. Click "Plan with AI"
4. Upload PDF brief
5. Verify parsing works
6. Progress through Stage 1

## 📚 Features

- **6-Stage Workflow**: Understanding → Research → Structure → Drafting → Formatting → Review
- **PDF/Word Upload**: AI parses deadline, word limit, requirements
- **Durmah Integration**: Stage-specific tutoring
- **OSCOLA Formatter**: Auto-citations & bibliography
- **Academic Integrity**: Full Durham compliance with AI usage tracking

## 📖 Full Documentation

See `ASSIGNMENT_ASSISTANT_README.md` for complete guide.
See `walkthrough.md` for implementation details.

**Ready to use!** 🎉
