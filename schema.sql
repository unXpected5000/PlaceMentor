CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT 'demo123',
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  department TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  year INTEGER,
  cgpa REAL DEFAULT 0,
  aptitude REAL DEFAULT 0,
  soft_skills REAL DEFAULT 0,
  resume_score REAL DEFAULT 0,
  prediction REAL DEFAULT 0,
  predicted_role TEXT DEFAULT '',
  status TEXT DEFAULT 'Applied',
  company TEXT DEFAULT '',
  package_lpa REAL DEFAULT 0,
  skills TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT DEFAULT 'Other',
  role TEXT DEFAULT '',
  min_cgpa REAL DEFAULT 0,
  package_lpa REAL DEFAULT 0,
  skills TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT DEFAULT 'Applied'
);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_ref TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  skills TEXT DEFAULT '[]',
  education TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  email TEXT PRIMARY KEY,
  image_key TEXT DEFAULT '',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_year ON students(year);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
