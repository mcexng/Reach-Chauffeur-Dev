-- Add corporate_id column to corporate_accounts table
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS corporate_id TEXT;

-- Populate existing rows with a random corporate ID if empty
UPDATE corporate_accounts SET corporate_id = 'CORP-' || floor(random() * 9000 + 1000)::text WHERE corporate_id IS NULL;
