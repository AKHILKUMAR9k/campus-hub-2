-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for users to their own registrations" ON registrations;
DROP POLICY IF EXISTS "Enable read access for event organizers" ON registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON registrations;

-- Create a comprehensive policy for creating registrations (Users can register themselves)
CREATE POLICY "Enable insert for authenticated users" ON registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a comprehensive policy for viewing registrations
-- 1. Users can see their own registrations
-- 2. Organizers can see registrations for events they created
CREATE POLICY "Enable read access for own registrations or own events" ON registrations
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = registrations.event_id 
    AND events.created_by = auth.uid()
  )
);

-- Enable delete for own registrations (Unregister) or Organizers (Remove student)
CREATE POLICY "Enable delete for own registrations or organizers" ON registrations
FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = registrations.event_id 
    AND events.created_by = auth.uid()
  )
);
