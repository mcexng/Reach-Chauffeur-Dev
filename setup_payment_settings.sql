-- Create settings table for global app configuration
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default payment settings
INSERT INTO settings (id, value) 
VALUES (
  'payment_details', 
  '{"bankName": "Sterling Corporate Bank", "accountNo": "009 812 3456", "accountName": "Reach Chauffeur Executive Ltd"}'
);
