-- Create Purchase Requests Table
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "number" TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    department TEXT NOT NULL,
    type TEXT NOT NULL,
    "typeDetail" TEXT,
    description TEXT,
    
    "orderNumber" TEXT,
    "orderDate" DATE,
    
    "commitmentNumber" TEXT,
    "commitmentDate" DATE,
    
    status TEXT CHECK (status IN ('requested', 'ordered', 'committed', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all access for authenticated users" ON public.purchase_requests FOR ALL USING (auth.role() = 'authenticated');
