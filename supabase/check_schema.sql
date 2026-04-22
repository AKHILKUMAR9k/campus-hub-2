-- Check users columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Check if event_gallery exists
SELECT exists (
   select from information_schema.tables 
   where table_schema = 'public'
   and table_name = 'event_gallery'
);

-- Check comments table columns and foreign keys
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comments';
