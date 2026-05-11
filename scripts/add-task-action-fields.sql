-- Add action_url and action_label columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS action_url text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS action_label text;
