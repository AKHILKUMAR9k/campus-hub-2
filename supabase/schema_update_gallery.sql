-- Create event_gallery table
CREATE TABLE event_gallery (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for event_gallery
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery" 
ON event_gallery FOR SELECT 
USING (true);

CREATE POLICY "Organizers and Admins can upload to gallery" 
ON event_gallery FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT created_by FROM events WHERE id = event_id
  ) OR 
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Organizers and Admins can delete from gallery" 
ON event_gallery FOR DELETE 
USING (
  auth.uid() IN (
    SELECT created_by FROM events WHERE id = event_id
  ) OR 
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
