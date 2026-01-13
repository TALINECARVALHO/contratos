-- COMPREHENSIVE FIX FOR PURCHASE REQUESTS
-- Run this script to ensure all columns exist and permissions are correct.

-- 1. Add missing generic column if not exists
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS "rejectionReason" text;

-- 2. Ensure status can accept 'rejected' (Drop valid status constraint if it exists and conflicts)
-- Attempt to drop common name check constraints just in case
ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS "purchase_requests_status_check";
-- (Optionally) Add new check constraint if you want strictness, or leave as text.
-- ALTER TABLE purchase_requests ADD CONSTRAINT "purchase_requests_status_check" CHECK (status IN ('requested', 'ordered', 'committed', 'completed', 'rejected'));

-- 3. FIX RLS POLICIES (Update and Delete were likely missing for Admins!)

-- DROP existing policies to clean up
DROP POLICY IF EXISTS "Purchase Requests Admin View Policy" ON purchase_requests; -- From previous step
DROP POLICY IF EXISTS "Purchase Requests Global View Policy" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests Admin Update Policy" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests Admin Delete Policy" ON purchase_requests;

-- RE-CREATE SELECT POLICY (Admin/Manager View All)
CREATE POLICY "Purchase Requests Admin View Policy" ON purchase_requests FOR SELECT USING (
  (auth.jwt() ->> 'role' = 'service_role') OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
         profiles.role IN ('super_admin', 'admin', 'manager') OR
         (profiles.permissions->'purchase_request'->>'view')::boolean = true OR
         (profiles.permissions->'purchase_request'->>'manage')::boolean = true
      )
    )
  )
);

-- CREATE UPDATE POLICY (Admin/Manager Update All)
CREATE POLICY "Purchase Requests Admin Update Policy" ON purchase_requests FOR UPDATE USING (
  (auth.jwt() ->> 'role' = 'service_role') OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
         profiles.role IN ('super_admin', 'admin', 'manager') OR
         (profiles.permissions->'purchase_request'->>'manage')::boolean = true
      )
    )
  )
);

-- CREATE DELETE POLICY (Admin/Manager Delete All)
CREATE POLICY "Purchase Requests Admin Delete Policy" ON purchase_requests FOR DELETE USING (
  (auth.jwt() ->> 'role' = 'service_role') OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
         profiles.role IN ('super_admin', 'admin', 'manager') OR
         (profiles.permissions->'purchase_request'->>'manage')::boolean = true
      )
    )
  )
);

-- Fix for Purchase Orders as well (ensure they can be managed)
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "rejectionReason" text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS "commitmentRejectionReason" text;

-- Simple RLS for Purchase Orders: Open for read/write if you can access parent? 
-- Simplification: Allow Authenticated Users to CRUD orders (Application logic restricts logic)
-- Or apply same Admin logic. Let's apply Admin Logic.
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders Admin All" ON purchase_orders;
CREATE POLICY "Orders Admin All" ON purchase_orders FOR ALL USING (
  (auth.jwt() ->> 'role' = 'service_role') OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
         profiles.role IN ('super_admin', 'admin', 'manager') OR
         (profiles.permissions->'purchase_request'->>'manage')::boolean = true
      )
    )
  )
);
-- And allow viewing for basic users (own department)? Complex.
-- For now, this fixes the ADMIN error.
