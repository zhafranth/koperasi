CREATE OR REPLACE FUNCTION public.is_pengurus(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = uid
      AND u.role = 'pengurus'
  );
$func$;

CREATE POLICY "Pengurus can insert users (definer)" ON public.users
  FOR INSERT
  WITH CHECK (public.is_pengurus(auth.uid()));

CREATE POLICY "Pengurus can update users (definer)" ON public.users
  FOR UPDATE
  USING (public.is_pengurus(auth.uid()));
