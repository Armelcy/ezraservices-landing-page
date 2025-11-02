-- Safe Fix for Ezra Admin Dashboard Schema Issues
-- Run these SQL commands ONE BY ONE in your Supabase SQL editor
-- If any command fails, skip it and continue with the next one

-- 1. Create the admin_users table
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

-- 2. Create deleted_users_audit table
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

-- 3. Create deleted_providers_audit table
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

-- 4. Create banned_emails table
CREATE TABLE IF NOT EXISTS banned_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    banned_by TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ban_reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_providers_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_users_audit" ON deleted_users_audit
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_providers_audit" ON deleted_providers_audit
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on banned_emails" ON banned_emails
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_users_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deleted_providers_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banned_emails TO authenticated;

-- 8. Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. Insert test admin user
INSERT INTO admin_users (email, full_name, role, created_by)
VALUES ('admin@ezraservice.com', 'Admin User', 'super_admin', 'system')
ON CONFLICT (email) DO NOTHING;