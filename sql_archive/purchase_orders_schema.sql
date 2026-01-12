-- Create Purchase Orders Table (1:N with Purchase Requests)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
    "number" TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all access for authenticated users" ON public.purchase_orders FOR ALL USING (auth.role() = 'authenticated');
