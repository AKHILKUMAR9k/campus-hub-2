-- FIX V2: Handle "Email already exists" error
-- This script replaces the previous trigger.
-- It handles the case where a user was deleted from Auth but remains in public.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  p_full_name text;
  p_role text;
  p_first_name text;
  p_last_name text;
  p_organizer_status text;
BEGIN
  -- 1. Extract data
  p_full_name := new.raw_user_meta_data->>'full_name';
  p_role := new.raw_user_meta_data->>'role';

  -- 2. Validate Role & Organizer Status
  IF p_role IS NULL OR p_role NOT IN ('student', 'club_organizer', 'admin') THEN
    p_role := 'student';
  END IF;

  IF p_role = 'club_organizer' THEN
    p_organizer_status := 'pending';
  ELSE
    p_organizer_status := NULL;
  END IF;

  -- 3. Parse Name
  IF p_full_name IS NOT NULL THEN
    p_first_name := split_part(p_full_name, ' ', 1);
    p_last_name := substring(p_full_name from length(p_first_name) + 2);
    IF p_last_name = '' THEN p_last_name := NULL; END IF;
  ELSE
    p_first_name := 'User';
  END IF;

  -- 4. Insert or Update (Upsert) logic
  -- We prioritize the primary key (id), but if email conflicts, we handle it.
  
  -- Logic: Check if a user with this email already exists in public table
  IF EXISTS (SELECT 1 FROM public.users WHERE email = new.email) THEN
      -- "Zombie" record found. Recast it to the new Auth ID.
      -- This re-links the old data to the new login.
      UPDATE public.users 
      SET 
        id = new.id, -- CRITICAL: Update the public ID to match the new Auth ID
        role = p_role,
        first_name = p_first_name,
        last_name = p_last_name,
        organizer_status = p_organizer_status,
        updated_at = NOW()
      WHERE email = new.email;
  ELSE
      -- Normal Insert
      INSERT INTO public.users (id, email, first_name, last_name, role, organizer_status)
      VALUES (new.id, new.email, p_first_name, p_last_name, p_role, p_organizer_status);
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Database error saving new user (Detail: %)', SQLERRM;
END;
$$;

-- Start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
