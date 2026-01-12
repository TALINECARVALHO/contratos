-- Create utility_units table
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

-- Enable RLS
ALTER TABLE public.utility_units ENABLE ROW LEVEL SECURITY;

-- Add policies (assuming same as other tables)
CREATE POLICY "Allow authenticated access to utility_units" ON public.utility_units
    FOR ALL USING (auth.role() = 'authenticated');

-- Migrate existing units from utility_bills to utility_units
INSERT INTO public.utility_units (consumer_unit, local_name, type, company, default_commitment_id)
SELECT DISTINCT ON (consumer_unit) 
    consumer_unit, 
    local_name, 
    type, 
    company, 
    commitment_id
FROM public.utility_bills
ON CONFLICT (consumer_unit) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_utility_units_updated_at
    BEFORE UPDATE ON public.utility_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
