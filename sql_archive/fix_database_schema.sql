-- 1. Ensure 'id' in 'profiles' is UNIQUE
-- We cannot add a Primary Key if one exists, but a Unique Constraint is sufficient for Foreign Keys.
ALTER TABLE profiles ADD CONSTRAINT profiles_id_unique UNIQUE (id);

-- 2. Add 'requester_id' column for Purchase Requests (if not exists)
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "requester_id" uuid REFERENCES profiles(id);

-- 3. Add 'object' column for Purchase Requests (if not exists)
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "object" text;

-- 4. Add 'contractNumber' column for Purchase Requests (if not exists)
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "contractNumber" text;
