-- FIX V2: Explicitly check profiles table for role, as auth.jwt() might not contain the app-level role.

-- Drop the previous policy if it was created
DROP POLICY IF EXISTS "Purchase Requests Admin View Policy" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests Global View Policy" ON purchase_requests;

-- Create the robust policy checking profiles.role
CREATE POLICY "Purchase Requests Admin View Policy" ON purchase_requests FOR SELECT USING (
  (
    -- Check if user is Super Admin, Admin, or Manager via Profiles table
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
         profiles.role = 'super_admin' OR
         profiles.role = 'admin' OR
         profiles.role = 'manager' OR
         -- Also check granular permissions
         (profiles.permissions->'purchase_request'->>'view')::boolean = true OR
         (profiles.permissions->'purchase_request'->>'manage')::boolean = true
      )
    )
  )
  OR
  (
    -- Service role bypass
    auth.jwt() ->> 'role' = 'service_role'
  )
);
