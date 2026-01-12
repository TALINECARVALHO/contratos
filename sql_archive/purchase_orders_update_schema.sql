-- Add Commitment columns to Purchase Orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS "commitmentNumber" TEXT,
ADD COLUMN IF NOT EXISTS "commitmentDate" DATE;
