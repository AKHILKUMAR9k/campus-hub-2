-- FIX: Re-create the handle_new_user function and trigger
-- This ensures that when a user signs up, their profile is correctly created in public.users

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
BEGIN
  -- 1. Extract data from the Auth metadata (sent from the Signup form)
  p_full_name := new.raw_user_meta_data->>'full_name';
  p_role := new.raw_user_meta_data->>'role';

  -- 2. Validate/Default Role
  -- Ensure role is valid against the Check Constraint ('student', 'club_organizer', 'admin')
  IF p_role IS NULL OR p_role NOT IN ('student', 'club_organizer', 'admin') THEN
    p_role := 'student'; -- Default to student if missing or invalid
  END IF;

  -- 3. Parse Name
  -- Logic: First word is First Name, everything else is Last Name
  IF p_full_name IS NOT NULL THEN
    p_first_name := split_part(p_full_name, ' ', 1);
    p_last_name := substring(p_full_name from length(p_first_name) + 2);
    
    -- Handle case where there is no last name
    IF p_last_name = '' THEN 
      p_last_name := NULL; 
    END IF;
  ELSE
    -- Fallback if no full_name provided
    p_first_name := 'User';
  END IF;

  -- 4. Insert into public.users table
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (new.id, new.email, p_first_name, p_last_name, p_role);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log the detailed error so we know what went wrong
  RAISE EXCEPTION 'Database error saving new user (Internal Detail: %)', SQLERRM;
END;
$$;

-- Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
