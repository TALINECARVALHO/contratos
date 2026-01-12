-- Create Supplementations Table
CREATE TABLE IF NOT EXISTS public.supplementations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "decreeNumber" TEXT NOT NULL,
    date DATE NOT NULL,
    value NUMERIC(15, 2) NOT NULL,
    type TEXT,
    source TEXT,
    justification TEXT,
    status TEXT CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplementations ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all access for authenticated users" ON public.supplementations FOR ALL USING (auth.role() = 'authenticated');
