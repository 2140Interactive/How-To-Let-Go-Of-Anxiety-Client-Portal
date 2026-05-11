-- Migration: Update project status values
-- Old values: discovery, in_progress, testing, training, live, completed
-- New values: new, active, complete

-- Step 1: Drop the existing constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Step 2: Update existing data to new values
UPDATE projects SET status = 'new' WHERE status = 'discovery';
UPDATE projects SET status = 'active' WHERE status IN ('in_progress', 'testing', 'training', 'live');
UPDATE projects SET status = 'complete' WHERE status = 'completed';

-- Step 3: Add new constraint with updated values
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
  CHECK (status = ANY (ARRAY['new', 'active', 'complete']));
