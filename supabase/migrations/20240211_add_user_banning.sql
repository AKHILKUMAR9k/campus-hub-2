-- Add status column to users table for banning functionality
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'banned'));

-- Update RLS to prevent banned users from doing anything
-- Note: This is a strict enforcement at the DB level
CREATE POLICY "Banned users cannot perform actions" ON public.users
    FOR ALL
    USING (status = 'active')
    WITH CHECK (status = 'active');
