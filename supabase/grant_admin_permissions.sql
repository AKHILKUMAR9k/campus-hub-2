-- Enable RLS on users if not already enabled (it should be)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow Admins to UPDATE any user's role
CREATE POLICY "Admins can update user roles"
ON users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Policy to allow Admins to UPDATE clubs (approve/reject)
CREATE POLICY "Admins can update clubs"
ON clubs
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
