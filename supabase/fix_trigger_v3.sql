-- FIX V3: The "Nuclear Option"
-- Instead of updating the old record (which can be tricky with Primary Keys),
-- we simply DELETE any old orphan record with this email before inserting the new one.

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
  -- 1. Extract and Validate
  p_full_name := new.raw_user_meta_data->>'full_name';
  p_role := COALESCE(new.raw_user_meta_data->>'role', 'student');

  IF p_role NOT IN ('student', 'club_organizer', 'admin') THEN p_role := 'student'; END IF;
  
  IF p_role = 'club_organizer' THEN p_organizer_status := 'pending'; ELSE p_organizer_status := NULL; END IF;

  -- 2. Parse Name
  IF p_full_name IS NOT NULL THEN
    p_first_name := split_part(p_full_name, ' ', 1);
    p_last_name := NULLIF(substring(p_full_name from length(p_first_name) + 2), '');
  ELSE
    p_first_name := 'User';
  END IF;

  -- 3. THE FIX: Delete any existing user with this email to prevent "Duplicate Key" errors
  -- This handles the case where the Auth user was deleted but the Public Profile wasn't.
  DELETE FROM public.users WHERE email = new.email;

  -- 4. Clean Insert
  INSERT INTO public.users (id, email, first_name, last_name, role, organizer_status)
  VALUES (new.id, new.email, p_first_name, p_last_name, p_role, p_organizer_status);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Trigger Error: %', SQLERRM;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
