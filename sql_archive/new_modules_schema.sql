-- Create Commitments (Empenhos) Table
CREATE TABLE IF NOT EXISTS public.commitments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "contractId" BIGINT REFERENCES public.contracts(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    value NUMERIC(15, 2) NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Daily Allowances (Diárias) Table
CREATE TABLE IF NOT EXISTS public.daily_allowances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryRole" TEXT NOT NULL,
    department TEXT NOT NULL,
    destination TEXT NOT NULL,
    "missionDescription" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalValue" NUMERIC(15, 2) NOT NULL,
    status TEXT CHECK (status IN ('requested', 'approved', 'paid', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Utility Bills (Contas de Água e Luz) Table
CREATE TABLE IF NOT EXISTS public.utility_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT CHECK (type IN ('water', 'light')),
    company TEXT NOT NULL,
    "consumerUnit" TEXT NOT NULL,
    "referenceMonth" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    value NUMERIC(15, 2) NOT NULL,
    barcode TEXT,
    status TEXT CHECK (status IN ('pending', 'paid')),
    "paymentDate" DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Optional, based on your policies)
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_bills ENABLE ROW LEVEL SECURITY;

-- Create simple policies (adjust as needed for roles)
CREATE POLICY "Enable all access for authenticated users" ON public.commitments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.daily_allowances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.utility_bills FOR ALL USING (auth.role() = 'authenticated');
