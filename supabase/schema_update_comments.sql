-- Add parent_id to comments for nesting
ALTER TABLE comments 
ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Create comment_likes table
CREATE TABLE comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- RLS Policies for comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can like comments" 
ON comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" 
ON comment_likes FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes" 
ON comment_likes FOR SELECT 
USING (true);
