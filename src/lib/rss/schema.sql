-- RSS Caching and Scheduling Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the required tables

-- Table: rss_cache
-- Stores cached RSS articles with intelligent caching metadata
CREATE TABLE IF NOT EXISTS rss_cache (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  articles JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_fetched TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified TEXT,
  etag TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disabled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: rss_schedule_logs  
-- Logs all RSS fetch executions for monitoring and debugging
CREATE TABLE IF NOT EXISTS rss_schedule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_time TIMESTAMPTZ NOT NULL,
  execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  sources_processed INTEGER NOT NULL DEFAULT 0,
  articles_fetched INTEGER NOT NULL DEFAULT 0,
  error_details TEXT,
  uk_time TEXT NOT NULL,
  execution_duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: rss_logs
-- Comprehensive logging for all RSS operations
CREATE TABLE IF NOT EXISTS rss_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uk_time TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rss_cache_source_url ON rss_cache(source_url);
CREATE INDEX IF NOT EXISTS idx_rss_cache_status ON rss_cache(status);
CREATE INDEX IF NOT EXISTS idx_rss_cache_last_fetched ON rss_cache(last_fetched);

CREATE INDEX IF NOT EXISTS idx_rss_schedule_logs_execution_time ON rss_schedule_logs(execution_time);
CREATE INDEX IF NOT EXISTS idx_rss_schedule_logs_status ON rss_schedule_logs(status);
CREATE INDEX IF NOT EXISTS idx_rss_schedule_logs_created_at ON rss_schedule_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_rss_logs_timestamp ON rss_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rss_logs_level ON rss_logs(level);
CREATE INDEX IF NOT EXISTS idx_rss_logs_source ON rss_logs(source);
CREATE INDEX IF NOT EXISTS idx_rss_logs_session_id ON rss_logs(session_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rss_cache_updated_at 
  BEFORE UPDATE ON rss_cache 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE rss_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_schedule_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for rss_cache
CREATE POLICY "Allow read access to rss_cache for authenticated users" ON rss_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow read access to all authenticated users for rss_schedule_logs  
CREATE POLICY "Allow read access to rss_schedule_logs for authenticated users" ON rss_schedule_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to perform all operations (for the RSS scheduler)
CREATE POLICY "Allow all operations for service role on rss_cache" ON rss_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all operations for service role on rss_schedule_logs" ON rss_schedule_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow read access to all authenticated users for rss_logs
CREATE POLICY "Allow read access to rss_logs for authenticated users" ON rss_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to perform all operations on rss_logs
CREATE POLICY "Allow all operations for service role on rss_logs" ON rss_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert initial RSS source configurations
INSERT INTO rss_cache (id, source_name, source_url, articles, status, metadata) 
VALUES 
  ('law-gazette', 'Law Gazette', 'https://www.lawgazette.co.uk/rss', '[]'::jsonb, 'active', '{"articlesCount": 0, "successfulFetch": false}'::jsonb),
  ('uk-ministry-justice', 'UK Ministry of Justice', 'https://www.gov.uk/government/organisations/ministry-of-justice.atom', '[]'::jsonb, 'active', '{"articlesCount": 0, "successfulFetch": false}'::jsonb),
  ('legal-cheek', 'Legal Cheek', 'https://www.legalcheek.com/feed/', '[]'::jsonb, 'active', '{"articlesCount": 0, "successfulFetch": false}'::jsonb),
  ('uk-supreme-court', 'UK Supreme Court', 'https://www.supremecourt.uk/rss/news.xml', '[]'::jsonb, 'active', '{"articlesCount": 0, "successfulFetch": false}'::jsonb),
  ('durham-university', 'Durham University', 'https://www.durham.ac.uk/news/rss/', '[]'::jsonb, 'active', '{"articlesCount": 0, "successfulFetch": false}'::jsonb)
ON CONFLICT (source_url) DO NOTHING;

-- Create a view for easy RSS monitoring
CREATE OR REPLACE VIEW rss_monitoring AS
SELECT 
  rc.source_name,
  rc.status,
  rc.last_fetched,
  (rc.metadata->>'articlesCount')::integer as article_count,
  rc.error_count,
  rsl.execution_time as last_successful_fetch,
  rsl.articles_fetched as last_articles_fetched
FROM rss_cache rc
LEFT JOIN LATERAL (
  SELECT execution_time, articles_fetched 
  FROM rss_schedule_logs 
  WHERE status = 'success' 
  ORDER BY execution_time DESC 
  LIMIT 1
) rsl ON true
ORDER BY rc.last_fetched DESC;

-- Grant access to the monitoring view
GRANT SELECT ON rss_monitoring TO authenticated;
GRANT SELECT ON rss_monitoring TO anon;

COMMENT ON TABLE rss_cache IS 'Cached RSS articles with intelligent caching using ETags and Last-Modified headers';
COMMENT ON TABLE rss_schedule_logs IS 'Execution logs for scheduled RSS fetching operations';
COMMENT ON VIEW rss_monitoring IS 'Monitoring view for RSS cache status and performance';