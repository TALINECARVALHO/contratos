-- RLS Update V2: Explicitly allow Authors (requester_id) to View/Update/Delete

-- 1. VIEW (Select)
-- Keep existing logic (Department/Admin/Manage) + Author
DROP POLICY IF EXISTS "Purchase Requests viewable by department or permissions" ON purchase_requests;
CREATE POLICY "Purchase Requests viewable by department, permissions or author"
ON purchase_requests FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true))
  OR
  department = (SELECT department FROM profiles WHERE id = auth.uid())
  OR
  requester_id = auth.uid()
);

-- 2. UPDATE
-- Allow Author to update
DROP POLICY IF EXISTS "Purchase Requests updatable by department or permissions" ON purchase_requests;
CREATE POLICY "Purchase Requests updatable by department, permissions or author"
ON purchase_requests FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true))
  OR
  department = (SELECT department FROM profiles WHERE id = auth.uid())
  OR
  requester_id = auth.uid()
);

-- 3. DELETE
-- Allow Author to delete (optional, but consistent with "Edit")
DROP POLICY IF EXISTS "Purchase Requests deletable by department or permissions" ON purchase_requests;
CREATE POLICY "Purchase Requests deletable by department, permissions or author"
ON purchase_requests FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'service_role')
  OR
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.permissions->'purchase_request'->>'manage')::boolean = true))
  OR
  department = (SELECT department FROM profiles WHERE id = auth.uid())
  OR
  requester_id = auth.uid()
);
