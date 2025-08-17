-- COLONAiVE™ Admin CRM Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
    handled_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triage Results Table
CREATE TABLE IF NOT EXISTS triage_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('high', 'moderate', 'low')),
    responses JSONB NOT NULL,
    urgency_score INTEGER DEFAULT 0,
    symptoms TEXT[],
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO Pages / Content Activity Table
CREATE TABLE IF NOT EXISTS seo_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    meta_description TEXT,
    keywords TEXT[],
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Tags Table (for CRM tagging)
CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(50) NOT NULL CHECK (tag_type IN ('sponsorship', 'clinical', 'public', 'follow_up')),
    assigned_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Tasks Table (for tracking AI operations)
CREATE TABLE IF NOT EXISTS ai_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_type VARCHAR(100) NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT,
    model_used VARCHAR(100) DEFAULT 'hunyuan-7b',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_time_ms INTEGER,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_results_risk_level ON triage_results(risk_level);
CREATE INDEX IF NOT EXISTS idx_triage_results_created_at ON triage_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_pages_status ON seo_pages(status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_published_at ON seo_pages(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_tags_user_id ON lead_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);

-- Row Level Security (RLS) policies

-- Contact Messages - Admin only
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admin can update contact messages" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Triage Results - Users can see their own, admins can see all
ALTER TABLE triage_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own triage results" ON triage_results
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all triage results" ON triage_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- SEO Pages - Public read, admin write
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are publicly readable" ON seo_pages
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admin can manage all pages" ON seo_pages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Lead Tags - Admin only
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage lead tags" ON lead_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- AI Tasks - Admin only
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage AI tasks" ON ai_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type IN ('admin', 'super_admin')
        )
    );

-- Insert some sample data for testing (optional)
INSERT INTO contact_messages (name, email, subject, message, status) VALUES
    ('John Doe', 'john@example.com', 'Partnership Inquiry', 'I am interested in partnering with COLONAiVE for clinical trials.', 'new'),
    ('Jane Smith', 'jane@example.com', 'Support Request', 'I need help with the triage assessment tool.', 'in_progress'),
    ('Dr. Wilson', 'wilson@hospital.com', 'Clinical Collaboration', 'Our hospital would like to discuss collaboration opportunities.', 'new');

INSERT INTO triage_results (risk_level, responses) VALUES
    ('high', '{"symptoms": ["severe_pain", "bleeding"], "duration": "2_weeks", "severity": 8}'),
    ('moderate', '{"symptoms": ["mild_pain", "discomfort"], "duration": "1_month", "severity": 5}'),
    ('low', '{"symptoms": ["occasional_discomfort"], "duration": "6_months", "severity": 2}');

INSERT INTO seo_pages (title, slug, content, status, published_at, views) VALUES
    ('Understanding Colorectal Cancer Risk Factors', 'colorectal-cancer-risk-factors', 'Comprehensive guide to risk factors...', 'published', NOW(), 1250),
    ('Early Detection Saves Lives', 'early-detection-guide', 'Learn about screening options...', 'published', NOW() - INTERVAL '1 week', 890),
    ('Nutrition and Colorectal Health', 'nutrition-colorectal-health', 'Diet and lifestyle factors...', 'draft', NULL, 0);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;