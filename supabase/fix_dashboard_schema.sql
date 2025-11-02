-- Fix Ezra Admin Dashboard Schema Issues
-- Run these SQL commands in your Supabase SQL editor

-- 1. First, let's create the admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    permissions JSONB DEFAULT '{}',
    created_by TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create audit trail tables
CREATE TABLE IF NOT EXISTS deleted_users_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    deleted_by TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deletion_reason TEXT,
    original_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deleted_providers_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_provider_id UUID,
    full_name TEXT,
    email TEXT,
    business_name TEXT,
    cni_number TEXT,
    deleted_by TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deletion_reason TEXT,
    original_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create banned emails table
CREATE TABLE IF NOT EXISTS banned_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    banned_by TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ban_reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add missing columns to existing tables
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS confirmation_code TEXT;

ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS cni_number TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON bookings(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_deleted_users_email ON deleted_users_audit(email);
CREATE INDEX IF NOT EXISTS idx_deleted_providers_email ON deleted_providers_audit(email);
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON banned_emails(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- 6. Update existing bookings with confirmation codes
UPDATE bookings 
SET confirmation_code = CONCAT('EZR-', UPPER(SUBSTRING(id::text, 1, 8)))
WHERE confirmation_code IS NULL;

-- 7. Create function to auto-generate confirmation codes for new bookings
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := CONCAT('EZR-', UPPER(SUBSTRING(NEW.id::text, 1, 8)));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for auto-generating confirmation codes
DROP TRIGGER IF EXISTS set_confirmation_code ON bookings;
CREATE TRIGGER set_confirmation_code
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_confirmation_code();

-- 9. Enable RLS on all admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_providers_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- 10. Create permissive RLS policies for admin access
-- (Note: These are permissive for development. Tighten for production)
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_users_audit" ON deleted_users_audit
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_providers_audit" ON deleted_providers_audit
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on banned_emails" ON banned_emails
    FOR ALL USING (true) WITH CHECK (true);

-- 11. Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_users_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_providers_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banned_emails TO authenticated;

-- Grant read permissions on existing tables
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON providers TO authenticated;
GRANT SELECT ON bookings TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 12. Insert a test admin user (optional - remove if you already have one)
INSERT INTO admin_users (email, full_name, role, created_by)
VALUES ('admin@ezraservice.com', 'Admin User', 'super_admin', 'system')
ON CONFLICT (email) DO NOTHING;

-- 13. Create a simple view to check if everything is working
CREATE OR REPLACE VIEW admin_dashboard_status AS
SELECT 
    'admin_users' as table_name,
    count(*) as record_count
FROM admin_users
UNION ALL
SELECT 
    'profiles' as table_name,
    count(*) as record_count
FROM profiles
UNION ALL
SELECT 
    'providers' as table_name,
    count(*) as record_count
FROM providers
UNION ALL
SELECT 
    'bookings' as table_name,
    count(*) as record_count
FROM bookings;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_status TO authenticated;