DO $$
DECLARE
  new_user_id uuid;
  old_user_id uuid := 'e808fdd9-0d01-4325-992d-0b2be4ed22a6'; -- The ID from your screenshot
BEGIN
  -- 1. Get your CURRENT User ID based on email
  SELECT id INTO new_user_id FROM public.users WHERE email = 'akhilsonu523@gmail.com';

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email akhilsonu523@gmail.com not found in public.users. Please sign up first!';
  END IF;

  -- 2. Update the orphaned events to belong to YOU
  UPDATE public.events
  SET created_by = new_user_id
  WHERE created_by = old_user_id;

  -- 3. Ensure you are an Organizer
  UPDATE public.users
  SET role = 'club_organizer', organizer_status = 'approved'
  WHERE id = new_user_id;

  RAISE NOTICE 'Success! Events have been transferred to User ID: %', new_user_id;
END $$;
