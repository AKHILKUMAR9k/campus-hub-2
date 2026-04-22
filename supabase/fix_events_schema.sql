-- FIX EVENTS SCHEMA: Add missing columns and refresh cache

-- 1. Ensure 'image_url' exists
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Ensure other columns that might be useful
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of text
ADD COLUMN IF NOT EXISTS registration_link TEXT,
ADD COLUMN IF NOT EXISTS registration_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time TEXT; -- Store time string like '10:00 AM'

-- 3. Force reload the schema cache for PostgREST
NOTIFY pgrst, 'reload config';
