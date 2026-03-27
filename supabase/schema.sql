-- ============================================================
-- TODOS TABLE SCHEMA FOR REAL-TIME DASHBOARD
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create the todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_agent TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Policy: allow public read (adjust for auth in production)
CREATE POLICY "Allow public read" ON public.todos
  FOR SELECT USING (true);

-- Policy: allow public insert
CREATE POLICY "Allow public insert" ON public.todos
  FOR INSERT WITH CHECK (true);

-- Policy: allow public update
CREATE POLICY "Allow public update" ON public.todos
  FOR UPDATE USING (true);

-- Policy: allow public delete
CREATE POLICY "Allow public delete" ON public.todos
  FOR DELETE USING (true);

-- ============================================================
-- ENABLE REALTIME
-- Supabase Realtime listens to postgres changes via publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;

-- ============================================================
-- SEED DATA — some starter tasks to populate the dashboard
-- ============================================================
INSERT INTO public.todos (title, status, priority, assigned_agent) VALUES
  ('Analyze Q3 performance metrics',     'completed',  'high',     'Agent Alpha'),
  ('Deploy ML pipeline to production',   'in_progress','critical', 'Agent Beta'),
  ('Write integration test suite',       'pending',    'medium',   'Agent Gamma'),
  ('Optimize database query planner',    'in_progress','high',     'Agent Alpha'),
  ('Update API rate limiting rules',     'pending',    'low',      NULL),
  ('Review security audit report',       'blocked',    'critical', 'Agent Delta'),
  ('Migrate legacy endpoints to REST',   'pending',    'medium',   'Agent Beta'),
  ('Set up monitoring & alerting',       'completed',  'high',     'Agent Gamma'),
  ('Document new authentication flow',   'pending',    'low',      'Agent Delta'),
  ('Load test payment gateway',          'in_progress','critical', 'Agent Alpha');
