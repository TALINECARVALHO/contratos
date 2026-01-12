-- Update utility_commitments table
ALTER TABLE utility_commitments ADD COLUMN IF NOT EXISTS dotation TEXT;
ALTER TABLE utility_commitments ALTER COLUMN consumer_unit DROP NOT NULL;

-- Update constraints for types
ALTER TABLE utility_commitments DROP CONSTRAINT IF EXISTS utility_commitments_type_check;
ALTER TABLE utility_commitments ADD CONSTRAINT utility_commitments_type_check CHECK (type IN ('water', 'light', 'phone', 'internet'));

-- Update utility_bills table
ALTER TABLE utility_bills ADD COLUMN IF NOT EXISTS local_name TEXT;
ALTER TABLE utility_bills DROP CONSTRAINT IF EXISTS utility_bills_type_check;
ALTER TABLE utility_bills ADD CONSTRAINT utility_bills_type_check CHECK (type IN ('water', 'light', 'phone', 'internet'));
