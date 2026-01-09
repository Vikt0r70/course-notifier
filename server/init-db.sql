CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    major VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    watch_all_courses BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_token_expiry TIMESTAMP,
    last_verification_email_sent TIMESTAMP,
    verification_emails_today INTEGER DEFAULT 0,
    verification_email_count_reset_date TIMESTAMP,
    faculty VARCHAR(255) NOT NULL,
    study_type VARCHAR(100) NOT NULL,
    time_shift VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_code, section, faculty, time_shift)
);

CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_code, section)
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,
    course_code VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_by_email BOOLEAN DEFAULT FALSE,
    sent_by_web BOOLEAN DEFAULT FALSE,
    sent_by_phone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scraper_logs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    courses_scraped INTEGER DEFAULT 0,
    courses_added INTEGER DEFAULT 0,
    courses_updated INTEGER DEFAULT 0,
    courses_removed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_faculty ON courses(faculty);
CREATE INDEX idx_courses_study_type ON courses(study_type);
CREATE INDEX idx_courses_is_open ON courses(is_open);
CREATE INDEX idx_courses_code_section ON courses(course_code, section);
CREATE INDEX idx_watchlists_user ON watchlists(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

INSERT INTO system_settings (key, value) VALUES 
    ('scraper_interval_minutes', '60'),
    ('scraper_auto_sync', 'false'),
    ('last_scraper_run', ''),
    ('next_scraper_run', '')
ON CONFLICT (key) DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (email, username, password_hash, major, age, is_email_verified, is_admin, faculty, study_type)
VALUES ('admin@coursenotifier.com', 'admin', '$2a$10$MAm4e3MHn3xJeM6rBUgmGuOl0r03IwLO2yEhwOTIDONq4j08LV23G', 'System Admin', 25, true, true, 'Administration', 'بكالوريوس')
ON CONFLICT (email) DO NOTHING;
