-- DATA ACCESS PERMISSION MIGRATION
-- Goal: Allow 'Contract Managers' (defined by granular permissions) to view and manage all contracts and minutes.

-- ==============================================================================
-- 1. CONTRACTS TABLE
-- ==============================================================================

-- ENABLE RLS (just in case)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- VIEW POLICY
-- Allow if: Admin, or Internal Control, or Has Permission (View/Manage), or Matching Department
DROP POLICY IF EXISTS "Contracts are viewable by department or admins" ON contracts;
CREATE POLICY "Contracts are viewable by department or permissions"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    -- 1. Super Users / Admins
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'pgm', 'service_role')
    OR
    -- 2. Internal Control Specific Email
    (auth.jwt() ->> 'email' = 'controleinterno.sfp@gmail.com')
    OR
    -- 3. Granular Permission Check (contracts.view OR contracts.manage)
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
          (profiles.permissions->'contracts'->>'view')::boolean = true
          OR
          (profiles.permissions->'contracts'->>'manage')::boolean = true
        )
      )
    )
    OR
    -- 4. Department Match (Default)
    department = (SELECT department FROM profiles WHERE id = auth.uid())
  );

-- INSERT POLICY
DROP POLICY IF EXISTS "Contracts are insertable by admins" ON contracts;
CREATE POLICY "Contracts are insertable by admins and managers"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.permissions->'contracts'->>'manage')::boolean = true
      )
    )
  );

-- UPDATE POLICY
DROP POLICY IF EXISTS "Contracts are updatable by admins" ON contracts;
CREATE POLICY "Contracts are updatable by admins and managers"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.permissions->'contracts'->>'manage')::boolean = true
      )
    )
  );

-- DELETE POLICY (Keep restricted to super_admin usually, but let's check)
-- Assuming only super_admin deletes.

-- ==============================================================================
-- 2. CONTRACT AMENDMENTS (ADITIVOS)
-- ==============================================================================

ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;

-- VIEW
DROP POLICY IF EXISTS "Amendments are viewable by everyone with access" ON contract_amendments;
DROP POLICY IF EXISTS "Amendments are viewable by authenticated users" ON contract_amendments;
CREATE POLICY "Amendments are viewable by authenticated users"
  ON contract_amendments FOR SELECT
  TO authenticated
  USING (true);

-- INSERT
DROP POLICY IF EXISTS "Amendments are insertable by admins" ON contract_amendments;
CREATE POLICY "Amendments are insertable by admins and managers"
  ON contract_amendments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.permissions->'contracts'->>'manage')::boolean = true
      )
    )
  );

-- UPDATE
DROP POLICY IF EXISTS "Amendments are updatable by admins" ON contract_amendments;
CREATE POLICY "Amendments are updatable by admins and managers"
  ON contract_amendments FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.permissions->'contracts'->>'manage')::boolean = true
      )
    )
  );

-- DELETE
DROP POLICY IF EXISTS "Amendments are deletable by admins" ON contract_amendments;
CREATE POLICY "Amendments are deletable by admins and managers"
  ON contract_amendments FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.permissions->'contracts'->>'manage')::boolean = true
      )
    )
  );


-- ==============================================================================
-- 3. MINUTES (ATAS)
-- ==============================================================================

ALTER TABLE minutes ENABLE ROW LEVEL SECURITY;

-- VIEW POLICY
-- Currently open to all authenticated users as per frontend logic ("TODOS podem ver Atas")
DROP POLICY IF EXISTS "Minutes are viewable by authenticated users" ON minutes;
CREATE POLICY "Minutes are viewable by authenticated users"
  ON minutes FOR SELECT
  TO authenticated
  USING (true);

-- INSERT POLICY
DROP POLICY IF EXISTS "Minutes are insertable by admins" ON minutes;
CREATE POLICY "Minutes are insertable by admins and managers"
  ON minutes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.permissions->'minutes'->>'manage')::boolean = true
      )
    )
  );

-- UPDATE POLICY
DROP POLICY IF EXISTS "Minutes are updatable by admins" ON minutes;
CREATE POLICY "Minutes are updatable by admins and managers"
  ON minutes FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
    OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.permissions->'minutes'->>'manage')::boolean = true
      )
    )
  );

-- DELETE POLICY
DROP POLICY IF EXISTS "Minutes are deletable by super admins" ON minutes;
CREATE POLICY "Minutes are deletable by super admins"
  ON minutes FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );
