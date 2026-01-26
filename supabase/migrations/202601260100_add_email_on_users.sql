-- Add optional email column back to users and enforce pengurus must have email
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_pengurus_email_required'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_pengurus_email_required
      CHECK (role <> 'pengurus' OR email IS NOT NULL);
  END IF;
END $$;

-- Update admin_insert_user function to accept optional email
CREATE OR REPLACE FUNCTION public.admin_insert_user(
  full_name text,
  phone text,
  role text,
  is_active boolean,
  email text DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _row public.users;
BEGIN
  IF NOT public.is_pengurus(auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  INSERT INTO public.users (full_name, phone, role, is_active, email)
  VALUES (full_name, phone, role, is_active, email)
  RETURNING * INTO _row;
  RETURN _row;
END;
$fn$;
