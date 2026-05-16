-- Create stripe_customers table to track Stripe customer IDs by project
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment
COMMENT ON TABLE stripe_customers IS 'Maps projects to their Stripe customer IDs for payment processing';

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "stripe_customers_admin" ON stripe_customers
  FOR SELECT
  USING (auth.email() IN ('lorraine@howtoletgoofanxiety.com', 'gregmarcel@icloud.com'));

CREATE POLICY "stripe_customers_own" ON stripe_customers
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON p.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Add stripe_customer_id column to payments table if it doesn't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Update payments table indexes for stripe columns
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_invoice ON payments(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_project ON stripe_customers(project_id);
