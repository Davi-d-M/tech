-- 1. Extend Staff with hardware binding
ALTER TABLE staff ADD COLUMN IF NOT EXISTS authorized_devices JSONB DEFAULT '[]';

-- 2. Extend Rider Status with hardware binding
ALTER TABLE rider_status ADD COLUMN IF NOT EXISTS authorized_devices JSONB DEFAULT '[]';

-- 3. Track Device IDs in login attempts for discovery
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS device_name TEXT;

-- 4. Create Policy for device self-lookup during login (if using RLS)
-- Usually handled via Service Role in the API, but good to have.
