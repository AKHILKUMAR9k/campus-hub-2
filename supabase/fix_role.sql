-- Run this to force your user to be an Organizer (or Admin)
-- Replace the email with your actual login email

UPDATE public.users 
SET 
  role = 'club_organizer', -- or 'admin' 
  organizer_status = 'approved'
WHERE email = 'akhilsonu523@gmail.com';
