-- ============================================================
-- GHOST TASK DECOMPOSITION — Migration
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- 1. Add hierarchy + ghost columns to todos
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS parent_id   UUID REFERENCES public.todos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_ghost    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS position    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes       TEXT;

-- 2. Index for fast children lookups
CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON public.todos(parent_id);
CREATE INDEX IF NOT EXISTS idx_todos_is_ghost  ON public.todos(is_ghost);

-- 3. Ghost feedback telemetry table
CREATE TABLE IF NOT EXISTS public.ghost_feedback (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_title  TEXT NOT NULL,
  ghost_title   TEXT NOT NULL,
  priority      TEXT NOT NULL,
  accepted      BOOLEAN NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.ghost_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert feedback" ON public.ghost_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read feedback"   ON public.ghost_feedback FOR SELECT USING (true);

-- 4. Enable realtime on ghost_feedback too
ALTER PUBLICATION supabase_realtime ADD TABLE public.ghost_feedback;

-- 5. View: tasks with child count + completion %
CREATE OR REPLACE VIEW public.todos_with_progress AS
SELECT
  t.*,
  COUNT(c.id)                                              AS child_count,
  COUNT(c.id) FILTER (WHERE c.status = 'completed')       AS child_completed,
  CASE
    WHEN COUNT(c.id) = 0 THEN NULL
    ELSE ROUND(
      COUNT(c.id) FILTER (WHERE c.status = 'completed')::NUMERIC
      / COUNT(c.id)::NUMERIC * 100
    )
  END AS completion_pct
FROM public.todos t
LEFT JOIN public.todos c ON c.parent_id = t.id AND c.is_ghost = false
WHERE t.is_ghost = false
GROUP BY t.id;

-- 6. Helper function: clean up stale ghost rows (> 10 min old, not accepted)
CREATE OR REPLACE FUNCTION cleanup_stale_ghosts()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.todos
  WHERE is_ghost = true
    AND accepted_at IS NULL
    AND created_at < NOW() - INTERVAL '10 minutes';
END;
$$;
