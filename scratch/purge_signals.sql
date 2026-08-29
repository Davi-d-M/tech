-- Apex OS: Signal History Purge
-- Wipes all developer-generated mock alerts for a clean tactical grid.
TRUNCATE TABLE public.system_signals;

-- Note: After running this in Supabase SQL Editor, click "Scan Operational Grid"
-- in the Admin Notification Center to repopulate with REAL data.
