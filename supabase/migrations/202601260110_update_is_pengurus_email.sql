-- Update helper to recognize pengurus by id OR email from JWT
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
    WHERE (u.id = uid OR (u.email IS NOT NULL AND u.email = (auth.jwt() ->> 'email')))
      AND u.role = 'pengurus'
  );
$func$;

-- Replace policies to use is_pengurus(auth.uid())
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='Pengurus can view all users') THEN
    DROP POLICY "Pengurus can view all users" ON public.users;
  END IF;
END $$;

CREATE POLICY "Pengurus can view all users" ON public.users
  FOR SELECT USING (public.is_pengurus(auth.uid()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='loans' AND policyname='Pengurus can manage all loans') THEN
    DROP POLICY "Pengurus can manage all loans" ON public.loans;
  END IF;
END $$;

CREATE POLICY "Pengurus can manage all loans" ON public.loans
  FOR ALL USING (public.is_pengurus(auth.uid()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments' AND policyname='Pengurus can manage all payments') THEN
    DROP POLICY "Pengurus can manage all payments" ON public.payments;
  END IF;
END $$;

CREATE POLICY "Pengurus can manage all payments" ON public.payments
  FOR ALL USING (public.is_pengurus(auth.uid()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='balance_history' AND policyname='Pengurus can manage balance history') THEN
    DROP POLICY "Pengurus can manage balance history" ON public.balance_history;
  END IF;
END $$;

CREATE POLICY "Pengurus can manage balance history" ON public.balance_history
  FOR ALL USING (public.is_pengurus(auth.uid()));
