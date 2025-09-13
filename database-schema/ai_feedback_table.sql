-- AI Feedback Table for Academic Integrity and Quality Assurance
-- This table stores student feedback about AI responses to maintain academic standards

CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    module TEXT, -- Optional: specific law module (e.g., "Constitutional Law", "Contract Law")
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    ai_response TEXT NOT NULL, -- The AI response being reviewed
    student_comments TEXT NOT NULL, -- Student's feedback about the response
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('inaccurate', 'confusing', 'helpful', 'general')),
    component_type TEXT NOT NULL CHECK (component_type IN ('chat', 'news_analysis', 'writing_analysis', 'wellbeing', 'other')),
    response_id TEXT, -- Optional: ID of the specific response (e.g., article ID, conversation ID)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'addressed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_status ON ai_feedback(status);
CREATE INDEX idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX idx_ai_feedback_component ON ai_feedback(component_type);
CREATE INDEX idx_ai_feedback_created_at ON ai_feedback(created_at DESC);

-- Create RLS (Row Level Security) policies
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own feedback
CREATE POLICY "Users can view own feedback" ON ai_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending feedback (within 24 hours)
CREATE POLICY "Users can update own pending feedback" ON ai_feedback
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status = 'pending' 
        AND created_at > (now() - interval '24 hours')
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER ai_feedback_updated_at_trigger
    BEFORE UPDATE ON ai_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_feedback_updated_at();

-- Comments for documentation
COMMENT ON TABLE ai_feedback IS 'Stores student feedback about AI responses for quality assurance and academic integrity';
COMMENT ON COLUMN ai_feedback.user_id IS 'References the student who provided the feedback';
COMMENT ON COLUMN ai_feedback.module IS 'Optional law module the feedback relates to';
COMMENT ON COLUMN ai_feedback.ai_response IS 'The AI response being reviewed (stored for context)';
COMMENT ON COLUMN ai_feedback.student_comments IS 'Student explanation of the issue or feedback';
COMMENT ON COLUMN ai_feedback.feedback_type IS 'Type of feedback: inaccurate, confusing, helpful, or general';
COMMENT ON COLUMN ai_feedback.component_type IS 'Which part of the app generated the response';
COMMENT ON COLUMN ai_feedback.response_id IS 'Optional identifier for the specific response';
COMMENT ON COLUMN ai_feedback.status IS 'Review status: pending, reviewed, or addressed';

-- Insert some example data for testing (optional - remove in production)
-- INSERT INTO ai_feedback (user_id, module, ai_response, student_comments, feedback_type, component_type) 
-- VALUES 
-- (
--     (SELECT id FROM profiles LIMIT 1),
--     'Constitutional Law',
--     'The separation of powers doctrine requires complete separation between the three branches of government.',
--     'This seems too absolute - there are checks and balances that create some overlap.',
--     'inaccurate',
--     'chat'
-- );