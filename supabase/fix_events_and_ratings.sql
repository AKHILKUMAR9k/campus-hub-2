-- 1. Enable UPDATE for events
DROP POLICY IF EXISTS "Enable update for users to their own events" ON events;

CREATE POLICY "Enable update for users to their own events" ON events
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- 2. Fix Ratings Foreign Key (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'ratings_user_id_fkey'
    ) THEN
        ALTER TABLE ratings
        ADD CONSTRAINT ratings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Verify Ratings RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON ratings;
CREATE POLICY "Enable read access for all users" ON ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON ratings;
CREATE POLICY "Enable insert for authenticated users" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Verify Events RLS (Ensure Select is open)
DROP POLICY IF EXISTS "Enable read access for all users" ON events;
CREATE POLICY "Enable read access for all users" ON events FOR SELECT USING (true);
