-- 1. Check your user details
SELECT id, email, role, organizer_status 
FROM public.users 
WHERE email = 'akhilsonu523@gmail.com'; -- Replace with your email if different

-- 2. Check if events exist for ANY user
SELECT id, title, created_by 
FROM public.events 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if orphaned events exist (created_by not in users table)
SELECT e.id, e.title, e.created_by 
FROM public.events e 
LEFT JOIN public.users u ON e.created_by = u.id 
WHERE u.id IS NULL;
