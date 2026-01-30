-- Add academic_item_id to quiz_sessions for canonical linking
ALTER TABLE quiz_sessions 
ADD COLUMN IF NOT EXISTS academic_item_id uuid REFERENCES academic_items(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_academic_item_id ON quiz_sessions(academic_item_id);

-- Trigger to auto-populate academic_item_id from target_id if it matches a lecture
-- (Optional: We will handle this in application logic for new sessions, 
--  but a backfill might be useful if we had a mapping table. 
--  For now, we leave it nullable and assume new sessions will populate it.)
