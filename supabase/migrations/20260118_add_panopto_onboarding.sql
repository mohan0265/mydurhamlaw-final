-- Add onboarding guide for Panopto lecture import
INSERT INTO public.onboarding_docs (
  doc_type,
  title,
  slug,
  category,
  content_markdown,
  summary,
  year_level,
  keywords,
  related_questions,
  display_order,
  is_published
) VALUES (
  'system_guide',
  'Import Panopto Lectures for AI Analysis',
  'import-panopto-lectures',
  'lectures',
  E'# How to Import Panopto Lectures

## Why Import Your Lectures?

MyDurhamLaw can analyze your lecture transcripts and automatically generate:
- 📝 **Comprehensive summaries** of the lecture content
- 🎯 **Key points** highlighting important concepts and cases
- 💬 **Discussion topics** for study groups and essay practice
- 📚 **Practice exam prompts** based on lecture material

---

## Step 1: Open Your Lecture Recording

1. Log into **Blackboard** (blackboard.durham.ac.uk)
2. Navigate to your module (e.g., Contract Law)
3. Click **Books & Tools** → **Encore/Panopto**
4. Select the lecture you want to import

---

## Step 2: Copy the Captions

Panopto auto-generates captions for all lectures. Here''s how to copy them:

1. In the **Panopto viewer**, look for the left sidebar
2. Click the **"Captions"** tab
3. You''ll see time-stamped text like:
   ```
   11:47 It might be necessary to look at academic sources...
   11:54 and you're encouraged to do so in your essay questions.
   ```
4. **Select all** the caption text (Ctrl+A or Cmd+A)
5. **Copy** it (Ctrl+C or Cmd+C)

> 💡 **Tip**: You can also copy and paste the **Panopto viewer URL** to keep a direct link to the recording.

---

## Step 3: Import to MyDurhamLaw

1. Open **MyDurhamLaw** → **My Lectures**
2. Click **"Add Lecture"**
3. Switch to the **"Import from Panopto"** tab
4. Fill in the lecture details:
   - **Title**: e.g., "Contract Law - Week 3: Consideration"
   - **Module Code**: e.g., LAW1071 (optional)
   - **Module Name**: e.g., Contract Law (optional)
   - **Lecturer**: e.g., Prof. Smith (optional)
   - **Date**: Select the lecture date
5. *Optional*: Paste the **Panopto viewer URL** for quick access
6. **Paste the captions** you copied into the **Transcript** box
7. Click **"Import & Analyze"**

---

## What Happens Next?

### 🤖 Durmah Analyzes Your Lecture

Within 10-15 seconds, you''ll get:

**Summary Example**:
> "This lecture focused on the legal concept of consideration in contract law. The professor discussed the requirements for valid consideration, including the rule in *Chappell & Co Ltd v Nestlé Co Ltd* [1960] AC 87. Key themes included adequacy vs sufficiency of consideration, past consideration, and the practical benefit doctrine from *Williams v Roffey Bros* [1991] 1 QB 1..."

**Key Points**:
- Rule from *Chappell v Nestlé*: consideration must be sufficient but need not be adequate
- Past consideration is not valid (*Re McArdle* [1951])
- Practical benefit can constitute consideration (*Williams v Roffey*)

**Discussion Topics**:
- Should the doctrine of promissory estoppel replace consideration?
- How does the practical benefit rule affect contract variations?

**Practice Prompts**:
- "Critically evaluate whether consideration is still necessary in modern contract law"
- "Advise X on whether their promise is enforceable given the lack of consideration"

---

## Ask Durmah About the Lecture

Once imported, you can:

1. Open the lecture in **My Lectures**
2. Click **"Ask Durmah"**
3. Get answers like:
   - "Explain the *Williams v Roffey* rule in simple terms"
   - "What are the essay hooks from this lecture?"
   - "Create a revision checklist for this topic"
   - "Which cases should I memorize?"

---

## Tips for Best Results

✅ **Do**:
- Import lectures as soon as possible after they''re uploaded
- Combine multiple lectures on the same topic for comprehensive notes
- Use the AI summaries as a starting point, not a replacement for your own notes

❌ **Don''t**:
- Rely solely on auto-generated captions (they may have errors)
- Use AI analysis as a substitute for attending lectures
- Share your imported transcripts without permission (IP considerations)

---

## Troubleshooting

**Problem**: Transcript is too short or incomplete
- **Solution**: Make sure you copied ALL the captions from Panopto

**Problem**: AI analysis failed
- **Solution**: The lecture is still saved. Try again later or contact support

**Problem**: Can''t find the Captions tab in Panopto
- **Solution**: Some older lectures may not have auto-captions. Contact your lecturer or module coordinator.

---

**Need Help?** Ask Durmah: "How do I import Panopto lectures?" or contact support via the Help widget.',
  'Learn how to copy lecture transcripts from Panopto and import them into MyDurhamLaw for AI-powered analysis, summaries, key points, discussion topics, and practice exam prompts.',
  ARRAY[1,2,3],
  ARRAY['panopto', 'lectures', 'transcript', 'AI analysis', 'import', 'captions', 'study', 'encore', 'blackboard'],
  ARRAY[
    'How do I import Panopto lectures?',
    'Can I analyze lecture recordings?',
    'Where do I paste lecture captions?',
    'How do I get lecture summaries?',
    'Panopto to MyDurhamLaw',
    'Copy Panopto transcript',
    'AI lecture analysis'
  ],
  5,
  true
);
