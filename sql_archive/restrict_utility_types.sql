-- Update utility types constraints
-- Keep only water, light, and phone. Remove internet.

-- 1. Update utility_commitments
ALTER TABLE public.utility_commitments DROP CONSTRAINT IF EXISTS utility_commitments_type_check;
ALTER TABLE public.utility_commitments ADD CONSTRAINT utility_commitments_type_check CHECK (type IN ('water', 'light', 'phone'));

-- 2. Update utility_bills
ALTER TABLE public.utility_bills DROP CONSTRAINT IF EXISTS utility_bills_type_check;
ALTER TABLE public.utility_bills ADD CONSTRAINT utility_bills_type_check CHECK (type IN ('water', 'light', 'phone'));
