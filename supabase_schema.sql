-- ============================================================
-- EagleHub Database Schema — Supabase (PostgreSQL)
-- Eagle Futsal Academy Management Platform
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MODULE 6: Competition & Tournament (Core — existing data)
-- ============================================================

CREATE TABLE IF NOT EXISTS competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('League', 'Knockout', 'Exhibition')),
  participants TEXT[] DEFAULT '{}',
  logo_url TEXT,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  competition_id TEXT REFERENCES competitions(id) ON DELETE SET NULL,
  stage TEXT,
  home_team TEXT NOT NULL DEFAULT '',
  away_team TEXT NOT NULL DEFAULT '',
  date TEXT,
  time TEXT,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'Belum Main',
  match_type TEXT CHECK (match_type IN ('Home', 'Away')),
  score_home INTEGER NOT NULL DEFAULT 0,
  score_away INTEGER NOT NULL DEFAULT 0,
  penalty_home INTEGER NOT NULL DEFAULT 0,
  penalty_away INTEGER NOT NULL DEFAULT 0,
  wo_loser TEXT CHECK (wo_loser IN ('Home', 'Away')),
  lineup INTEGER[] DEFAULT '{}',
  goals JSONB DEFAULT '[]',
  evaluation TEXT,
  pre_match_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  number INTEGER NOT NULL,
  position TEXT NOT NULL DEFAULT 'Flank',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS standings (
  id TEXT PRIMARY KEY,
  competition_id TEXT REFERENCES competitions(id) ON DELETE CASCADE,
  team TEXT NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  won_pk INTEGER NOT NULL DEFAULT 0,
  lost_pk INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 1: Academy Operational Core
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  dob DATE NOT NULL,
  age_cohort TEXT NOT NULL CHECK (age_cohort IN ('U-5', 'U-8', 'U-12', 'U-15')),
  parent_name TEXT,
  parent_phone TEXT,
  medical_notes TEXT,
  jersey_size TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  session_type TEXT NOT NULL DEFAULT 'training' CHECK (session_type IN ('training', 'match')),
  scanned_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('SPP', 'Kit', 'Camp', 'Event', 'Other')),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coach_name TEXT,
  age_cohort TEXT,
  venue TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 2: Athlete Performance & LTAD
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_evals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_name TEXT,
  date DATE NOT NULL,
  passing INTEGER NOT NULL CHECK (passing BETWEEN 1 AND 10),
  dribbling INTEGER NOT NULL CHECK (dribbling BETWEEN 1 AND 10),
  ball_control INTEGER NOT NULL CHECK (ball_control BETWEEN 1 AND 10),
  shooting INTEGER NOT NULL CHECK (shooting BETWEEN 1 AND 10),
  tactical INTEGER NOT NULL CHECK (tactical BETWEEN 1 AND 10),
  composite_score DECIMAL(4,2) GENERATED ALWAYS AS ((passing + dribbling + ball_control + shooting + tactical)::DECIMAL / 5) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS physical_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  bmi DECIMAL(5,2),
  beep_test_level DECIMAL(4,1),
  vo2max DECIMAL(5,2),
  agility_time DECIMAL(5,2),
  vertical_jump DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  coach_name TEXT,
  age_cohort TEXT,
  rpe INTEGER NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  duration_minutes INTEGER NOT NULL,
  total_load INTEGER GENERATED ALWAYS AS (rpe * duration_minutes) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 3: Business Analytics & Finance
-- ============================================================

CREATE TABLE IF NOT EXISTS finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('income', 'expense')),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 5: Event & Tournament Project Management
-- ============================================================

CREATE TABLE IF NOT EXISTS event_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT REFERENCES competitions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('pre-event', 'event-day', 'post-event')),
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT REFERENCES competitions(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('utama', 'pendukung', 'media')),
  package_fee INTEGER,
  impressions INTEGER DEFAULT 0,
  logo_url TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) — Public read, auth write
-- ============================================================

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_evals ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Public READ policies (tournaments, matches, standings = public)
CREATE POLICY "Public read competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read standings" ON standings FOR SELECT USING (true);

-- Authenticated WRITE policies
CREATE POLICY "Auth write competitions" ON competitions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write matches" ON matches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write players" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write standings" ON standings FOR ALL USING (auth.role() = 'authenticated');

-- Private data — authenticated only
CREATE POLICY "Auth only students" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only attendance" ON attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only field_schedules" ON field_schedules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only performance_evals" ON performance_evals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only physical_tests" ON physical_tests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only training_sessions" ON training_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only finances" ON finances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only event_tasks" ON event_tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth only sponsors" ON sponsors FOR ALL USING (auth.role() = 'authenticated');
