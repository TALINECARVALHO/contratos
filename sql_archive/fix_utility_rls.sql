-- Enable RLS for Utility Tables
ALTER TABLE public.utility_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_bills ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.utility_commitments;
CREATE POLICY "Enable all access for authenticated users" ON public.utility_commitments FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.utility_bills;
CREATE POLICY "Enable all access for authenticated users" ON public.utility_bills FOR ALL USING (auth.role() = 'authenticated');
