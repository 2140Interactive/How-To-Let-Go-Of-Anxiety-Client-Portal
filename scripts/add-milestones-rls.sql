-- Enable RLS on milestones table if not already enabled
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Development policy: Allow all authenticated users to see all milestones
-- (for testing purposes)
CREATE POLICY dev_anon_milestones ON milestones
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Production policy: Allow clients to see only milestones from their own projects
CREATE POLICY milestones_own ON milestones
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );
