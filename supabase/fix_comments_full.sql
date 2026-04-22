-- ⚠️ WARNING: This will delete existing comments. 
-- Since the feature was broken, this is likely acceptable to ensure a clean state.

-- 1. Drop dependent tables and existing table
DROP TABLE IF EXISTS comment_likes;
DROP TABLE IF EXISTS comments;

-- 2. Recreate Comments Table with UUID
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Self-referencing for replies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recreate Comment Likes Table
CREATE TABLE comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 4. Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Comments

-- View: Everyone can view
CREATE POLICY "Anyone can view comments" 
ON comments FOR SELECT 
USING (true);

-- Insert: Authenticated users can comment
CREATE POLICY "Users can insert own comments" 
ON comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update: Users can update their own comments
CREATE POLICY "Users can update own comments" 
ON comments FOR UPDATE 
USING (auth.uid() = user_id);

-- Delete: Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
ON comments FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Policies for Likes

-- View: Everyone can view likes
CREATE POLICY "Anyone can view likes" 
ON comment_likes FOR SELECT 
USING (true);

-- Insert: Users can like
CREATE POLICY "Users can like comments" 
ON comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Delete: Users can unlike
CREATE POLICY "Users can unlike comments" 
ON comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Grant permissions (fix for "permission denied" or "relation not found" for anon/authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE comments TO anon, authenticated;
GRANT ALL ON TABLE comment_likes TO anon, authenticated;
