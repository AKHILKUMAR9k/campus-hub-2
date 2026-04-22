-- FORCE REFRESH SCHEMA CACHE & ENSURE RELATIONSHIPS
-- Run this in Supabase SQL Editor

-- 1. Explicitly drop and re-add the Foreign Key to be 100% sure it matches PostgREST expectations
ALTER TABLE public.registrations 
DROP CONSTRAINT IF EXISTS registrations_event_id_fkey;

ALTER TABLE public.registrations
ADD CONSTRAINT registrations_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events(id)
ON DELETE CASCADE;

-- 2. Notify PostgREST to reload the schema cache (Crucial after schema changes)
NOTIFY pgrst, 'reload config';

-- 3. Verify 'club' column exists in events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'club'
    ) THEN
        ALTER TABLE public.events ADD COLUMN club TEXT;
    END IF;
END $$;
