-- Create problem_reports table for users to report issues
CREATE TABLE IF NOT EXISTS problem_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature', 'other')),
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_problem_reports_user_id ON problem_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON problem_reports(status);
CREATE INDEX IF NOT EXISTS idx_problem_reports_created_at ON problem_reports(created_at DESC);
