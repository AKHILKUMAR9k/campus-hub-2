-- FIX SCHEMA: Add missing columns and enable relationships

-- 1. Fix 'events' table missing 'created_by'
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Try to add 'club_name' to registrations for easier querying (denormalization)
-- OR ensuring the relationship for joins uses 'event_id'
-- (This part is just ensuring the Foreign Key exists for the Join fix in the frontend)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registrations_event_id_fkey'
    ) THEN
        ALTER TABLE public.registrations
        ADD CONSTRAINT registrations_event_id_fkey
        FOREIGN KEY (event_id)
        REFERENCES public.events(id)
        ON DELETE CASCADE;
    END IF;
END $$;
