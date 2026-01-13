-- Add rejectionReason to purchase_requests
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "rejectionReason" text;

-- If status is a constrained text or enum, we might need to update it.
-- Assuming text check constraint or raw text for now.
-- If you use an ENUM type in Postgres, you might need:
-- ALTER TYPE "YourStatusEnumType" ADD VALUE 'rejected';
