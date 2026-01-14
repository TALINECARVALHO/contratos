-- FIX: Ensure Users with 'Manage' permissions for Contracts OR Minutes can view ALL records (Global Visibility)

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
      profiles.role IN ('admin', 'super_admin', 'pgm') -- Removed 'manager' from global list to respect scoped permissions, UNLESS they have specific override below.
      -- Re-adding 'manager' because the previous fix assumed manager might want to see all? 
      -- Actually, user said "Configuration to manage contracts".
      -- Use 'manager' here IF 'manager' role implies global access. 
      -- In Purchase, we restricted 'manager'.
      -- But let's stick to permissions.
      
      -- B. Explicit Granular Permission (View or Manage on Contracts or Minutes)
      OR (profiles.permissions->'contracts'->>'view')::boolean = true
      OR (profiles.permissions->'contracts'->>'manage')::boolean = true
      OR (profiles.permissions->'minutes'->>'view')::boolean = true
      OR (profiles.permissions->'minutes'->>'manage')::boolean = true
      
      -- C. Department Match (Standard Users & Dept Managers without global perm)
      OR (
         profiles.department = contracts.department
      )
    )
  )
);

-- Ensure Update/Delete policies also respect 'manage' permission
DROP POLICY IF EXISTS "Contracts Manage Policy" ON contracts;

CREATE POLICY "Contracts Manage Policy" ON contracts
FOR ALL TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin'
  OR (auth.jwt() ->> 'email' = 'controleinterno.sfp@gmail.com')
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role IN ('admin', 'super_admin', 'pgm')
      OR (profiles.permissions->'contracts'->>'manage')::boolean = true
      OR (profiles.permissions->'minutes'->>'manage')::boolean = true
      OR (
         profiles.department = contracts.department
         AND profiles.role = 'manager' -- Only managers can edit their dept contracts by default? Or anyone?
         -- Assuming Standard Users cannot Edit unless they have 'manage' permission?
         -- But typically we might want to check if they are owner or role=manager.
         -- For safety, let's allow Department Managers to manage their own dept contracts.
      )
    )
  )
);
