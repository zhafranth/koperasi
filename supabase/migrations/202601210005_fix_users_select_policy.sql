-- Replace recursive SELECT policy with JWT-claim based policy to avoid recursion
DROP POLICY IF EXISTS "Pengurus can view all users" ON users;

-- If JWT contains role='pengurus', allow viewing all users
CREATE POLICY "Pengurus can view all users" ON users
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'pengurus');

