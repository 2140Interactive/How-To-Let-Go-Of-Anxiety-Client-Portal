-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admin policy: Allow admin to see all payments
DROP POLICY IF EXISTS "payments_admin" ON payments;
CREATE POLICY "payments_admin" ON payments
  FOR SELECT
  USING (auth.email() = 'automatewhatyoucan@gmail.com');

-- Client policy: Allow clients to see only payments from their own projects
DROP POLICY IF EXISTS "payments_own" ON payments;
CREATE POLICY "payments_own" ON payments
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.auth_user_id = auth.uid()
    )
  );
