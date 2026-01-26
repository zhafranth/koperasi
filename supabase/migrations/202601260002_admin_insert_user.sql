CREATE OR REPLACE FUNCTION public.admin_insert_user(
  full_name text,
  phone text,
  role text,
  is_active boolean
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
  INSERT INTO public.users (full_name, phone, role, is_active, password)
  VALUES (full_name, phone, role, is_active, '')
  RETURNING * INTO _row;
  RETURN _row;
END;
$fn$;
