-- Consolidated schema fix for Daily Allowances
-- Run this in Supabase SQL Editor to ensure all features work correctly

-- 1. Make fields nullable (for phased data entry)
ALTER TABLE public.daily_allowances ALTER COLUMN "beneficiaryRole" DROP NOT NULL;
ALTER TABLE public.daily_allowances ALTER COLUMN department DROP NOT NULL;
ALTER TABLE public.daily_allowances ALTER COLUMN destination DROP NOT NULL;
ALTER TABLE public.daily_allowances ALTER COLUMN "missionDescription" DROP NOT NULL;
ALTER TABLE public.daily_allowances ALTER COLUMN "startDate" DROP NOT NULL;
ALTER TABLE public.daily_allowances ALTER COLUMN "endDate" DROP NOT NULL;
ALTER TABLE public.daily_allowances ALTER COLUMN "totalValue" DROP NOT NULL;

-- 2. Add Feedback column (for approvals/rejections)
ALTER TABLE public.daily_allowances ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 3. Add Bank Details and File URLs
ALTER TABLE public.daily_allowances ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE public.daily_allowances ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE public.daily_allowances ADD COLUMN IF NOT EXISTS agency TEXT;
ALTER TABLE public.daily_allowances ADD COLUMN IF NOT EXISTS "solicitationFileUrl" TEXT;
ALTER TABLE public.daily_allowances ADD COLUMN IF NOT EXISTS "accountabilityFileUrl" TEXT;

-- 4. Add Type column
ALTER TABLE public.daily_allowances ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'antecipated';

-- 5. Ensure status column can accept new values (Drop old check constraint if exists and just use Text, or update it)
-- We try to drop common constraint names just in case
ALTER TABLE public.daily_allowances DROP CONSTRAINT IF EXISTS daily_allowances_status_check;
ALTER TABLE public.daily_allowances ADD CONSTRAINT daily_allowances_status_check 
  CHECK (status IN ('requested', 'committed', 'payment_ordered', 'paid', 'rejected', 'accountability_approved', 'accountability_rejected'));

-- 6. Cleanup (if "bankAccount" was added by mistake previously, we can ignore or drop it, let's keep it to avoid data loss but we use bankName/accountNumber)
