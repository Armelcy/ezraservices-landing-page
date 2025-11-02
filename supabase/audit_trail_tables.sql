-- Audit Trail and Ban Management Tables for Ezra Admin Dashboard
-- Run these SQL commands in your Supabase SQL editor

-- Table for tracking deleted users
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

-- Table for tracking deleted providers  
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

-- Table for banned email addresses
CREATE TABLE IF NOT EXISTS banned_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    banned_by TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ban_reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for admin users (sub-admins)
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

-- Enable Row Level Security
ALTER TABLE deleted_users_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_providers_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin can view deleted users audit" ON deleted_users_audit
    FOR SELECT USING (true);

CREATE POLICY "Admin can insert deleted users audit" ON deleted_users_audit
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view deleted providers audit" ON deleted_providers_audit
    FOR SELECT USING (true);

CREATE POLICY "Admin can insert deleted providers audit" ON deleted_providers_audit
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage banned emails" ON banned_emails
    FOR ALL USING (true);

CREATE POLICY "Admin can manage admin users" ON admin_users
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deleted_users_email ON deleted_users_audit(email);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at ON deleted_users_audit(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_providers_email ON deleted_providers_audit(email);
CREATE INDEX IF NOT EXISTS idx_deleted_providers_cni ON deleted_providers_audit(cni_number);
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON banned_emails(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);