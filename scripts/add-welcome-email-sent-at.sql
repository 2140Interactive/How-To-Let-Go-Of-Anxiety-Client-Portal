-- Add welcome_email_sent_at column to projects table
ALTER TABLE projects ADD COLUMN welcome_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for filtering projects by welcome email status
CREATE INDEX idx_projects_welcome_email_sent_at ON projects(welcome_email_sent_at);
