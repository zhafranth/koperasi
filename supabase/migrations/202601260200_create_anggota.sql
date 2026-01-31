-- Tabel anggota: data keanggotaan terpisah dari users (tidak berelasi ke users)
create extension if not exists pgcrypto;

create table if not exists public.anggota (
  id uuid primary key default gen_random_uuid(),
  nomor_anggota varchar(50) unique,
  full_name varchar(255) not null,
  phone varchar(20),
  address text,
  status varchar(20) check (status in ('aktif', 'nonaktif')) default 'aktif',
  tanggal_gabung date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- indeks yang berguna
create index if not exists idx_anggota_full_name on public.anggota (full_name);
create index if not exists idx_anggota_status on public.anggota (status);

-- aktifkan RLS
alter table public.anggota enable row level security;

create or replace function public.auth_email()
returns text
language sql
stable
as $$
  select coalesce((current_setting('request.jwt.claims', true))::jsonb->>'email', '');
$$;

create or replace function public.is_pengurus(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.users u
    where (u.id = uid or (u.email is not null and u.email = public.auth_email()))
      and u.role = 'pengurus'
      and coalesce(u.is_active, true)
  );
$$;

-- kebijakan akses: hanya pengurus yang dapat mengelola penuh
drop policy if exists "Pengurus dapat SELECT anggota" on public.anggota;
create policy "Pengurus dapat SELECT anggota"
  on public.anggota
  for select
  using (public.is_pengurus(auth.uid()));

drop policy if exists "Pengurus dapat INSERT anggota" on public.anggota;
create policy "Pengurus dapat INSERT anggota"
  on public.anggota
  for insert
  with check (public.is_pengurus(auth.uid()));

drop policy if exists "Pengurus dapat UPDATE anggota" on public.anggota;
create policy "Pengurus dapat UPDATE anggota"
  on public.anggota
  for update
  using (public.is_pengurus(auth.uid()))
  with check (public.is_pengurus(auth.uid()));

drop policy if exists "Pengurus dapat DELETE anggota" on public.anggota;
create policy "Pengurus dapat DELETE anggota"
  on public.anggota
  for delete
  using (public.is_pengurus(auth.uid()));

-- trigger sederhana untuk updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists anggota_set_updated_at on public.anggota;
create trigger anggota_set_updated_at
before update on public.anggota
for each row
execute procedure public.set_updated_at();
