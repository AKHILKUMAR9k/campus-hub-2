-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read/update their own row
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Events policies
-- Anyone can read events
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
-- Only creators can create/update/delete events
CREATE POLICY "Creators can manage own events" ON events FOR ALL USING (auth.uid() = created_by);

-- Registrations policies
-- Users can create their own registrations
CREATE POLICY "Users can create own registrations" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can view their own registrations; organizers can view registrations for their events
CREATE POLICY "Users can view own registrations" ON registrations FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM events WHERE events.id::text = registrations.event_id::text AND events.created_by = auth.uid()
  )
);
-- Users can delete their own registrations
CREATE POLICY "Users can delete own registrations" ON registrations FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
-- Anyone can read comments
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
-- Only authors can create/update/delete comments
CREATE POLICY "Authors can manage own comments" ON comments FOR ALL USING (auth.uid() = user_id);

-- Reminders policies
-- Users can only access their own reminders
CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
-- Users can only access their own notifications
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Clubs policies
-- Anyone can read approved clubs
CREATE POLICY "Anyone can view approved clubs" ON clubs FOR SELECT USING (status = 'approved');
-- Organizers can manage their own clubs
CREATE POLICY "Organizers can manage own clubs" ON clubs FOR ALL USING (auth.uid() = organizer_id);
-- Admins can manage all clubs
CREATE POLICY "Admins can manage all clubs" ON clubs FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
