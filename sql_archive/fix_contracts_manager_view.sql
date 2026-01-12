-- FIX: Allow Managers to view ALL Contracts
-- The previous policy relied on JWT roles or explicit permissions.
-- This update checks the `profiles.role` column explicitly.

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contracts View Policy" ON contracts;

CREATE POLICY "Contracts View Policy" ON contracts
FOR SELECT TO authenticated
USING (
  -- 1. Super Admin or Special Accounts (Bypass everything)
  auth.jwt() ->> 'role' = 'super_admin'
  OR (auth.jwt() ->> 'email' = 'controleinterno.sfp@gmail.com')
  
  OR 
  
  -- 2. Profile-based Access (Roles & Permissions)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- A. Global Visibility Roles
      profiles.role IN ('admin', 'super_admin', 'manager', 'pgm')
      
      -- B. Explicit Granular Permission
      OR (profiles.permissions->'contracts'->>'view')::boolean = true
      OR (profiles.permissions->'contracts'->>'manage')::boolean = true
      
      -- C. Department Match (Standard Users)
      -- If they are NOT a global role and have no special permission, they stick to their department.
      OR (
         profiles.department = contracts.department
      )
    )
  )
);
