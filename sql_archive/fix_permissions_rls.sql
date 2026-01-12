-- FIX: RLS Policies for Granular Permissions
-- This script drops restrictive policies and reapplies granular permission policies for all major tables.

-- 1. CONTRACTS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contracts manage policy" ON contracts;
DROP POLICY IF EXISTS "Contracts view policy" ON contracts;
DROP POLICY IF EXISTS "Contracts View Policy" ON contracts; -- Exact name match
DROP POLICY IF EXISTS "Contracts Insert Policy" ON contracts;
DROP POLICY IF EXISTS "Contracts Update Policy" ON contracts;
DROP POLICY IF EXISTS "Contracts Delete Policy" ON contracts;
DROP POLICY IF EXISTS "Contracts are viewable by department or permissions" ON contracts;
DROP POLICY IF EXISTS "Contracts are insertable by admins and managers" ON contracts;
DROP POLICY IF EXISTS "Contracts are updatable by admins and managers" ON contracts;
DROP POLICY IF EXISTS "Contracts are deletable by admins" ON contracts;

-- Re-create Policies
CREATE POLICY "Contracts View Policy" ON contracts
FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'pgm', 'service_role')
  OR (auth.jwt() ->> 'email' = 'controleinterno.sfp@gmail.com')
  OR (department = (SELECT department FROM profiles WHERE id = auth.uid()))
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        (profiles.permissions->'contracts'->>'view')::boolean = true OR
        (profiles.permissions->'contracts'->>'manage')::boolean = true
      )
    )
  )
);

CREATE POLICY "Contracts Insert Policy" ON contracts
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'contracts'->>'manage')::boolean = true
    )
  )
);

CREATE POLICY "Contracts Update Policy" ON contracts
FOR UPDATE TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'contracts'->>'manage')::boolean = true
    )
  )
);

CREATE POLICY "Contracts Delete Policy" ON contracts
FOR DELETE TO authenticated
USING (auth.jwt() ->> 'role' = 'super_admin'); -- Only Super Admin deletes usually


-- 2. MINUTES (ATAS)
ALTER TABLE minutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Minutes View Policy" ON minutes;
DROP POLICY IF EXISTS "Minutes Insert Policy" ON minutes;
DROP POLICY IF EXISTS "Minutes Update Policy" ON minutes;

-- View: Open to all authenticated (as per business rule)
CREATE POLICY "Minutes View Policy" ON minutes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Minutes Insert Policy" ON minutes FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'minutes'->>'manage')::boolean = true
    )
  )
);

CREATE POLICY "Minutes Update Policy" ON minutes FOR UPDATE TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'minutes'->>'manage')::boolean = true
    )
  )
);


-- 3. BIDDINGS (LICITAÇÕES)
ALTER TABLE biddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Biddings View Policy" ON biddings;
DROP POLICY IF EXISTS "Biddings Insert Policy" ON biddings;
DROP POLICY IF EXISTS "Biddings Update Policy" ON biddings;

CREATE POLICY "Biddings View Policy" ON biddings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Biddings Insert Policy" ON biddings FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'biddings'->>'manage')::boolean = true
    )
  )
);

CREATE POLICY "Biddings Update Policy" ON biddings FOR UPDATE TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'biddings'->>'manage')::boolean = true
    )
  )
);


-- 4. CONTRACT AMENDMENTS (ADITIVOS)
ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Amendments View Policy" ON contract_amendments;
DROP POLICY IF EXISTS "Amendments Insert Policy" ON contract_amendments;
DROP POLICY IF EXISTS "Amendments Update Policy" ON contract_amendments;

CREATE POLICY "Amendments View Policy" ON contract_amendments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Amendments Insert Policy" ON contract_amendments FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'contracts'->>'manage')::boolean = true
    )
  )
);

CREATE POLICY "Amendments Update Policy" ON contract_amendments FOR UPDATE TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'service_role')
  OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'contracts'->>'manage')::boolean = true
    )
  )
);

-- Ensure profiles are readable so policies work
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles Viewable by Everyone" ON profiles;
CREATE POLICY "Profiles Viewable by Everyone" ON profiles FOR SELECT TO authenticated USING (true);
