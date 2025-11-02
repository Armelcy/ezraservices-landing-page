-- Final Fix for Ezra Admin Dashboard - Handles Existing Policies
-- Run this complete script in your Supabase SQL editor

-- 1. Create tables (will skip if they already exist)
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

CREATE TABLE IF NOT EXISTS banned_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    banned_by TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ban_reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS (will skip if already enabled)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_providers_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow all operations on deleted_users_audit" ON deleted_users_audit;
DROP POLICY IF EXISTS "Allow all operations on deleted_providers_audit" ON deleted_providers_audit;
DROP POLICY IF EXISTS "Allow all operations on banned_emails" ON banned_emails;

-- 4. Create new policies
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_users_audit" ON deleted_users_audit
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_providers_audit" ON deleted_providers_audit
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on banned_emails" ON banned_emails
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Grant permissions (will skip if already granted)
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_users_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_providers_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banned_emails TO authenticated;

-- 6. Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. Grant permissions on existing tables (if they exist)
DO $$
BEGIN
    -- Check and grant permissions on existing tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        GRANT SELECT ON profiles TO authenticated;
        RAISE NOTICE 'Granted permissions on profiles table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers' AND table_schema = 'public') THEN
        GRANT SELECT ON providers TO authenticated;
        RAISE NOTICE 'Granted permissions on providers table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
        GRANT SELECT ON bookings TO authenticated;
        RAISE NOTICE 'Granted permissions on bookings table';
    END IF;
END
$$;

-- 8. Insert test admin user (will skip if email already exists)
INSERT INTO admin_users (email, full_name, role, created_by)
VALUES ('admin@ezraservice.com', 'Admin User', 'super_admin', 'system')
ON CONFLICT (email) DO NOTHING;

-- 9. Create a simple test query to verify everything works
SELECT 'Setup completed successfully! Admin tables created and permissions granted.' AS status;