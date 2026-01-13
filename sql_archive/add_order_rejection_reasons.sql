-- Add rejection reason columns to purchase_orders table
-- Using quoted identifiers to match camelCase property names in TypeScript / JSON payload

ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS "rejectionReason" text;

ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS "commitmentRejectionReason" text;
