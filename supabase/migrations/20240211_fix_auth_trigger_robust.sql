-- Safe and Robust Auth Trigger
-- Handles new user signups by creating a matching profile in public.users
-- Uses ON CONFLICT to avoid errors on race conditions

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
  p_avatar text;
BEGIN
  -- 1. Extract Metadata
  p_full_name := new.raw_user_meta_data->>'full_name';
  p_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  p_avatar := new.raw_user_meta_data->>'avatar_url';

  -- Validate Role
  IF p_role NOT IN ('student', 'club_organizer', 'admin') THEN 
    p_role := 'student'; 
  END IF;
  
  -- Set Status for Organizers
  IF p_role = 'club_organizer' THEN 
    p_organizer_status := 'pending'; 
  ELSE 
    p_organizer_status := NULL; 
  END IF;

  -- 2. Parse Name (Simple Split)
  IF p_full_name IS NOT NULL THEN
    p_first_name := split_part(p_full_name, ' ', 1);
    p_last_name := NULLIF(substring(p_full_name from length(p_first_name) + 2), '');
  ELSE
    p_first_name := 'User';
  END IF;

  -- 3. Upsert into public.users
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    organizer_status,
    avatar
  )
  VALUES (
    new.id, 
    new.email, 
    p_first_name, 
    p_last_name, 
    p_role, 
    p_organizer_status,
    p_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    role = COALESCE(EXCLUDED.role, public.users.role),
    updated_at = now();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction (optional, but good for debugging)
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN new;
END;
$$;

-- Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
