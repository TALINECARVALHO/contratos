-- Add new columns to daily_allowances table
ALTER TABLE public.daily_allowances 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('antecipated', 'posteriori')),
ADD COLUMN IF NOT EXISTS "bankAccount" TEXT,
ADD COLUMN IF NOT EXISTS agency TEXT,
ADD COLUMN IF NOT EXISTS "solicitationFileUrl" TEXT,
ADD COLUMN IF NOT EXISTS "accountabilityFileUrl" TEXT;
