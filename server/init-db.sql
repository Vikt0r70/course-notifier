-- Course Notifier Database Schema
-- This file is run ONLY on first container start with empty volume
-- Keep this in sync with Sequelize models!

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    major VARCHAR(255),
    age INTEGER,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_otp_code VARCHAR(6),
    email_otp_expires_at TIMESTAMP WITH TIME ZONE,
    otp_attempts_count INTEGER DEFAULT 0,
    otp_attempts_reset_at TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN DEFAULT FALSE,
    watch_all_courses BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_token_expiry TIMESTAMP WITH TIME ZONE,
    faculty VARCHAR(255),
    study_type VARCHAR(100) NOT NULL,
    time_shift VARCHAR(50),
    last_verification_email_sent TIMESTAMP WITH TIME ZONE,
    verification_emails_today INTEGER DEFAULT 0,
    verification_email_count_reset_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    -- Global notification settings
    notify_on_open BOOLEAN DEFAULT TRUE,
    notify_on_close BOOLEAN DEFAULT FALSE,
    notify_on_similar_course BOOLEAN DEFAULT TRUE,
    notify_by_email BOOLEAN DEFAULT TRUE,
    notify_by_web BOOLEAN DEFAULT TRUE,
    notify_by_phone BOOLEAN DEFAULT FALSE,
    push_topic_secret VARCHAR(64),
    fcm_token VARCHAR(255)
);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    course_name VARCHAR(500) NOT NULL,
    credit_hours VARCHAR(10) NOT NULL,
    room VARCHAR(100) NOT NULL,
    instructor VARCHAR(255) NOT NULL,
    days VARCHAR(50) NOT NULL,
    time VARCHAR(100) NOT NULL,
    teaching_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    faculty VARCHAR(255) NOT NULL,
    study_type VARCHAR(100) NOT NULL,
    time_shift VARCHAR(50),
    period VARCHAR(100),
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    first_opened_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- WATCHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    course_code VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    course_name VARCHAR(500) NOT NULL,
    faculty VARCHAR(255),
    instructor VARCHAR(255),
    notify_on_open BOOLEAN DEFAULT TRUE,
    notify_on_close BOOLEAN DEFAULT FALSE,
    notify_on_similar_course BOOLEAN DEFAULT TRUE,
    notify_by_email BOOLEAN DEFAULT TRUE,
    notify_by_web BOOLEAN DEFAULT TRUE,
    notify_by_phone BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP WITH TIME ZONE,
    similar_filters JSONB,
    similar_filter_newly_opened BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, course_code, section)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    watchlist_id INTEGER REFERENCES watchlists(id) ON UPDATE CASCADE ON DELETE SET NULL,
    course_code VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_by_email BOOLEAN DEFAULT FALSE,
    sent_by_web BOOLEAN DEFAULT FALSE,
    sent_by_phone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PROBLEM REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS problem_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ============================================
-- SCRAPER LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scraper_logs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    courses_scraped INTEGER DEFAULT 0,
    courses_added INTEGER DEFAULT 0,
    courses_updated INTEGER DEFAULT 0,
    courses_removed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_courses_faculty ON courses(faculty);
CREATE INDEX IF NOT EXISTS idx_courses_study_type ON courses(study_type);
CREATE INDEX IF NOT EXISTS idx_courses_is_open ON courses(is_open);
CREATE INDEX IF NOT EXISTS idx_courses_code_section ON courses(course_code, section);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================
-- DEFAULT DATA
-- ============================================
INSERT INTO system_settings (key, value, updated_at) VALUES 
    ('scraper_interval_minutes', '60', NOW()),
    ('scraper_auto_sync', 'false', NOW()),
    ('last_scraper_run', '', NOW()),
    ('next_scraper_run', '', NOW())
ON CONFLICT (key) DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (
    email, username, password_hash, major, age, 
    is_email_verified, is_admin, faculty, study_type,
    created_at, updated_at
)
VALUES (
    'admin@coursenotifier.com', 'admin', 
    '$2a$10$MAm4e3MHn3xJeM6rBUgmGuOl0r03IwLO2yEhwOTIDONq4j08LV23G', 
    'System Admin', 25, 
    true, true, 'Administration', 'بكالوريوس',
    NOW(), NOW()
)
ON CONFLICT (email) DO NOTHING;
