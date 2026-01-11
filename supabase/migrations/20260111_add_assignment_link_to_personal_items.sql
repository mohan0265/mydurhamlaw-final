-- Add assignment_id link to personal_items for YAAG ↔ Assignments sync
-- This enables bidirectional sync between calendar view and assignments

-- Add assignment_id column to personal_items
ALTER TABLE public.personal_items
ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_personal_items_assignment_id ON public.personal_items(assignment_id);

-- Add comment
COMMENT ON COLUMN public.personal_items.assignment_id IS 'Links this calendar item to an assignment in the assignments table for bidirectional sync';
