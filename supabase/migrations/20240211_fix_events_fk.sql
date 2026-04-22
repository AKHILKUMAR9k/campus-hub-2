-- Fix foreign key to allow Supabase JS to join events with public.users profile
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;

ALTER TABLE public.events
ADD CONSTRAINT events_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.users(id)
ON DELETE CASCADE;
