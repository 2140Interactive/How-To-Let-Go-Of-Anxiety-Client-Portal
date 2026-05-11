-- Create messages table for project communications
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'client')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying by project
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);

-- Create index for efficient querying by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_type, sender_id);

-- Create index for unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(project_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policy: Clients can read messages for their own projects
CREATE POLICY "Clients can read project messages" ON messages
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );

-- RLS policy: Clients can insert messages for their own projects
CREATE POLICY "Clients can send messages" ON messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'client' AND
    sender_id = auth.uid() AND
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );
