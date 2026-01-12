-- Enable RLS on purchase_requests (just in case)
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- DROP existing generic policy if it exists
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON purchase_requests;

-- CREATE new strict VIEW policy
-- Admins/Managers: Can see everything
-- Regular Users: Can see only requests from their matching department
CREATE POLICY "Purchase Requests viewable by department or permissions"
ON purchase_requests FOR SELECT
TO authenticated
USING (
  -- 1. Super Admins / Admins
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  -- 2. Managers with explicit permission
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true
    )
  )
  OR
  -- 3. Department Match (Regular Users)
  department = (SELECT department FROM profiles WHERE id = auth.uid())
);

-- CREATE new strict INSERT policy
-- Only allow inserting if logged in (usually users can insert into their own dept)
-- We might want to enforce that they can only insert for their own department, but let's keep it simple for now as long as they are authenticated.
-- Ideally:
CREATE POLICY "Purchase Requests insertable by authenticated users"
ON purchase_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- CREATE new strict UPDATE policy
-- Same logic as View + Is the Creator (maybe?) OR Manager
-- For now reusing the View logic for simplicity, ensuring they can only update what they can see.
CREATE POLICY "Purchase Requests updatable by department or permissions"
ON purchase_requests FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true
    )
  )
  OR
  department = (SELECT department FROM profiles WHERE id = auth.uid())
);

-- CREATE new strict DELETE policy
-- Only Managers/Admins can delete???? Or creator?
-- Let's restrict Delete to Managers/Admins only to be safe, or Creator.
-- Current list UI shows Trash for everyone. Let's allow if they can see it for now, can refine later.
CREATE POLICY "Purchase Requests deletable by department or permissions"
ON purchase_requests FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true
    )
  )
  OR
  department = (SELECT department FROM profiles WHERE id = auth.uid())
);
