-- Fix database permissions and add missing columns for Ezra Admin
-- Run these SQL commands in your Supabase SQL editor

-- 1. Add missing confirmation_code column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS confirmation_code TEXT;

-- 2. Create index for confirmation_code search
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON bookings(confirmation_code);

-- 3. Update existing bookings with confirmation codes if they don't have them
UPDATE bookings 
SET confirmation_code = CONCAT('EZR-', UPPER(SUBSTRING(id::text, 1, 8)))
WHERE confirmation_code IS NULL;

-- 4. Grant proper permissions to the authenticated role for admin tables
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_users_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_providers_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banned_emails TO authenticated;

-- 5. Grant permissions on existing tables that might be missing
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON providers TO authenticated;
GRANT SELECT ON bookings TO authenticated;

-- 6. Update RLS policies to be more permissive for admin operations
DROP POLICY IF EXISTS "Admin can view deleted users audit" ON deleted_users_audit;
DROP POLICY IF EXISTS "Admin can insert deleted users audit" ON deleted_users_audit;
DROP POLICY IF EXISTS "Admin can view deleted providers audit" ON deleted_providers_audit;
DROP POLICY IF EXISTS "Admin can insert deleted providers audit" ON deleted_providers_audit;
DROP POLICY IF EXISTS "Admin can manage banned emails" ON banned_emails;
DROP POLICY IF EXISTS "Admin can manage admin users" ON admin_users;

-- Create more permissive policies for admin access
CREATE POLICY "Allow all operations on deleted_users_audit" ON deleted_users_audit
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_providers_audit" ON deleted_providers_audit  
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on banned_emails" ON banned_emails
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on admin_users" ON admin_users
    USING (true) WITH CHECK (true);

-- 7. Ensure sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Add CNI number column to providers if missing
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS cni_number TEXT;

-- 9. Add business_name column to providers if missing
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- 10. Create function to generate confirmation codes for new bookings
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := CONCAT('EZR-', UPPER(SUBSTRING(NEW.id::text, 1, 8)));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to auto-generate confirmation codes
DROP TRIGGER IF EXISTS set_confirmation_code ON bookings;
CREATE TRIGGER set_confirmation_code
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_confirmation_code();