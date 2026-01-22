-- Fix RLS policies on users to avoid infinite recursion during INSERT/UPDATE
-- Remove recursive policies referencing users inside users policy
DROP POLICY IF EXISTS "Pengurus can insert users" ON users;
DROP POLICY IF EXISTS "Pengurus can update users" ON users;

-- Allow each authenticated user to insert their own row
CREATE POLICY "Users can insert their own row" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow each authenticated user to update their own row
CREATE POLICY "Users can update their own row" ON users
  FOR UPDATE
  USING (auth.uid() = id);

