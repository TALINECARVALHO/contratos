-- Create Supplementation Requests Table (Header)
CREATE TABLE IF NOT EXISTS public.supplementation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department TEXT NOT NULL,
    responsible_name TEXT NOT NULL,
    return_email TEXT NOT NULL,
    is_excess_revenue BOOLEAN DEFAULT false,
    is_surplus BOOLEAN DEFAULT false,
    total_addition NUMERIC(15, 2) DEFAULT 0,
    total_reduction NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Create Supplementation Items Table (Additions and Reductions)
CREATE TABLE IF NOT EXISTS public.supplementation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.supplementation_requests(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('addition', 'reduction')),
    dotation TEXT,
    rubric TEXT,
    value NUMERIC(15, 2) NOT NULL,
    resource TEXT,
    justification TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplementation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplementation_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for authenticated users" ON public.supplementation_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.supplementation_items FOR ALL USING (auth.role() = 'authenticated');
