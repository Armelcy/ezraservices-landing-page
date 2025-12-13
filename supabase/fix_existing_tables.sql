-- Fix permissions for existing tables only

-- 1. Grant permissions on admin tables we created
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_users_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_providers_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banned_emails TO authenticated;

-- 2. Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Update RLS policies to be more permissive
DROP POLICY IF EXISTS "Admin can view deleted users audit" ON deleted_users_audit;
DROP POLICY IF EXISTS "Admin can insert deleted users audit" ON deleted_users_audit;
DROP POLICY IF EXISTS "Admin can view deleted providers audit" ON deleted_providers_audit;
DROP POLICY IF EXISTS "Admin can insert deleted providers audit" ON deleted_providers_audit;
DROP POLICY IF EXISTS "Admin can manage banned emails" ON banned_emails;
DROP POLICY IF EXISTS "Admin can manage admin users" ON admin_users;

-- Create permissive policies
CREATE POLICY "Allow all operations on deleted_users_audit" ON deleted_users_audit
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_providers_audit" ON deleted_providers_audit  
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on banned_emails" ON banned_emails
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on admin_users" ON admin_users
    USING (true) WITH CHECK (true);