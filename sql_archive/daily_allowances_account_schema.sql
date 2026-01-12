-- Add accountNumber column and ensure data types
ALTER TABLE public.daily_allowances 
ADD COLUMN IF NOT EXISTS "accountNumber" TEXT,
ADD COLUMN IF NOT EXISTS "bankName" TEXT;

-- We can migrate old data if needed, or just focus on new structure
-- ALTER TABLE public.daily_allowances DROP COLUMN IF EXISTS email; -- Optional, can leave it unused
