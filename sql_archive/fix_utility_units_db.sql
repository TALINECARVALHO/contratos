-- Consolidated Fix for Utility Units Database
-- This script ensures the table exists, has correct policies, and migrates any orphan units from utility_bills.

-- 1. Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.utility_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_unit TEXT NOT NULL UNIQUE,
    local_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('water', 'light', 'phone')),
    company TEXT NOT NULL,
    department TEXT,
    default_commitment_id UUID REFERENCES public.utility_commitments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.utility_units ENABLE ROW LEVEL SECURITY;

-- 4. Create policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'utility_units' AND policyname = 'Allow authenticated access to utility_units'
    ) THEN
        CREATE POLICY "Allow authenticated access to utility_units" ON public.utility_units
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 5. Migrate/Sync units from utility_bills (Crucial step)
-- This ensures that any unit already present in bills becomes a registered unit.
INSERT INTO public.utility_units (consumer_unit, local_name, type, company, default_commitment_id)
SELECT DISTINCT ON (consumer_unit) 
    consumer_unit, 
    local_name, 
    type, 
    company, 
    commitment_id
FROM public.utility_bills
ON CONFLICT (consumer_unit) DO UPDATE 
SET 
    local_name = EXCLUDED.local_name,
    company = EXCLUDED.company,
    type = EXCLUDED.type;

-- 6. Ensure the trigger for updated_at exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_utility_units_updated_at ON public.utility_units;
CREATE TRIGGER update_utility_units_updated_at
    BEFORE UPDATE ON public.utility_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
