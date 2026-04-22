-- Ensure Comment Likes Table Exists
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authors can manage own comments" ON comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

DROP POLICY IF EXISTS "Anyone can view likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

-- Create Policies for Comments
CREATE POLICY "Anyone can view comments" 
ON comments FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own comments" 
ON comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
ON comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
ON comments FOR DELETE 
USING (auth.uid() = user_id);

-- Create Policies for Comment Likes
CREATE POLICY "Anyone can view likes" 
ON comment_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can like comments" 
ON comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" 
ON comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Verify comments table has parent_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_id') THEN
        ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
    END IF;
END $$;
