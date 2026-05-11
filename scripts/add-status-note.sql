-- Add status_note column to milestones table
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS status_note text;

-- Seed the in-progress milestone with a status note
UPDATE milestones
SET status_note = 'Building your onboarding sequences and testing with sample employee data. Expecting to move to Testing phase by end of February.'
WHERE id = '00000000-0000-0000-0000-000000000105';
