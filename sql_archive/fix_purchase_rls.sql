-- Fix RLS for Purchase Requests to allow Managers/Admins to see all
-- Multiple policies are ORed, so adding this policy grants access even if the default is strict.

CREATE POLICY "Purchase Requests Admin View Policy" ON purchase_requests FOR SELECT USING (
  (auth.jwt() ->> 'role' = 'super_admin') OR
  (auth.jwt() ->> 'role' = 'admin') OR
  (auth.jwt() ->> 'role' = 'manager') OR
  (auth.jwt() ->> 'role' = 'service_role') OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
         profiles.permissions->'purchase_request'->>'view' = 'true' OR
         profiles.permissions->'purchase_request'->>'manage' = 'true'
      )
    )
  )
);

-- Ensure authenticated users can still see their own department (if existing policy is missing or broken)
-- CREATE POLICY "Purchase Requests Dept View Policy" ON purchase_requests FOR SELECT USING (
--   department = (select department from profiles where id = auth.uid())
-- );
