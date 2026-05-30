-- Add source column to courses to track which scraper added the course
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'public';
CREATE INDEX IF NOT EXISTS idx_courses_source ON courses(source);

-- Add source column to scraper_logs to track which scraper ran
ALTER TABLE scraper_logs ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'public';
