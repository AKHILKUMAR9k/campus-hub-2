-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);

-- CLUBS
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON public.clubs;
CREATE POLICY "Clubs are viewable by everyone" 
ON public.clubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage clubs" ON public.clubs;
CREATE POLICY "Admins can manage clubs" 
ON public.clubs FOR ALL 
USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- EVENTS
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" 
ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organizers/Admins can insert events" ON public.events;
CREATE POLICY "Organizers/Admins can insert events" 
ON public.events FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND (
    exists (select 1 from public.users where id = auth.uid() and role IN ('club_organizer', 'admin'))
  )
);

DROP POLICY IF EXISTS "Creators/Admins can update events" ON public.events;
CREATE POLICY "Creators/Admins can update events" 
ON public.events FOR UPDATE 
USING (
  auth.uid() = created_by OR
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

DROP POLICY IF EXISTS "Creators/Admins can delete events" ON public.events;
CREATE POLICY "Creators/Admins can delete events" 
ON public.events FOR DELETE 
USING (
  auth.uid() = created_by OR
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- REGISTRATIONS
DROP POLICY IF EXISTS "Users can see own registrations" ON public.registrations;
CREATE POLICY "Users can see own registrations" 
ON public.registrations FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers can see event registrations" ON public.registrations;
CREATE POLICY "Organizers can see event registrations" 
ON public.registrations FOR SELECT 
USING (
  exists (select 1 from public.events where id = event_id and created_by = auth.uid()) OR
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

DROP POLICY IF EXISTS "Users can register themselves" ON public.registrations;
CREATE POLICY "Users can register themselves" 
ON public.registrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users/Organizers can delete registrations" ON public.registrations;
CREATE POLICY "Users/Organizers can delete registrations" 
ON public.registrations FOR DELETE 
USING (
  auth.uid() = user_id OR
  exists (select 1 from public.events where id = event_id and created_by = auth.uid()) OR
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- COMMENTS
DROP POLICY IF EXISTS "Comments are public" ON public.comments;
CREATE POLICY "Comments are public" 
ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can comment" 
ON public.comments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id OR exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
