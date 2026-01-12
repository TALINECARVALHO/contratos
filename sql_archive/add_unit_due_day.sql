-- Add due_day column to utility_units table
-- This stores the fixed day of the month when bills are due for each unit

ALTER TABLE public.utility_units 
ADD COLUMN IF NOT EXISTS due_day INTEGER;

-- Add a check constraint to ensure the day is between 1 and 31
ALTER TABLE public.utility_units
ADD CONSTRAINT check_due_day_range CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31));

COMMENT ON COLUMN public.utility_units.due_day IS 'Dia fixo do mês para vencimento das contas (1-31)';
