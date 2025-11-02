-- Optional: Add missing columns to existing tables
-- Run these ONLY if you have bookings and providers tables
-- If any command fails, it means the table doesn't exist - skip it

-- Add confirmation_code to bookings table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_code TEXT;
        
        -- Update existing bookings with confirmation codes
        UPDATE bookings 
        SET confirmation_code = CONCAT('EZR-', UPPER(SUBSTRING(id::text, 1, 8)))
        WHERE confirmation_code IS NULL;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON bookings(confirmation_code);
        
        -- Create trigger function
        CREATE OR REPLACE FUNCTION generate_confirmation_code()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            IF NEW.confirmation_code IS NULL THEN
                NEW.confirmation_code := CONCAT('EZR-', UPPER(SUBSTRING(NEW.id::text, 1, 8)));
            END IF;
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        -- Create trigger
        DROP TRIGGER IF EXISTS set_confirmation_code ON bookings;
        CREATE TRIGGER set_confirmation_code
            BEFORE INSERT ON bookings
            FOR EACH ROW
            EXECUTE FUNCTION generate_confirmation_code();
            
        RAISE NOTICE 'Successfully updated bookings table';
    ELSE
        RAISE NOTICE 'Bookings table does not exist - skipping';
    END IF;
END
$$;

-- Add columns to providers table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') THEN
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS cni_number TEXT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS business_name TEXT;
        RAISE NOTICE 'Successfully updated providers table';
    ELSE
        RAISE NOTICE 'Providers table does not exist - skipping';
    END IF;
END
$$;

-- Grant permissions on existing tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        GRANT SELECT ON profiles TO authenticated;
        RAISE NOTICE 'Granted permissions on profiles table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') THEN
        GRANT SELECT ON providers TO authenticated;
        RAISE NOTICE 'Granted permissions on providers table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        GRANT SELECT ON bookings TO authenticated;
        RAISE NOTICE 'Granted permissions on bookings table';
    END IF;
END
$$;