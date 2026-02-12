-- Supabase schema for 22Âº BPM dashboard
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null check (role in ('ADMIN','COMANDO','USER')),
  rank text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_username on public.app_users(username);
create index if not exists idx_app_users_role on public.app_users(role);

create or replace function public.set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists tr_app_users_updated_at on public.app_users;
create trigger tr_app_users_updated_at before update on public.app_users
for each row execute procedure public.set_timestamp();

create table if not exists public.traffic_infractions (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  month smallint not null check (month between 0 and 11),
  year integer not null check (year between 2000 and 2100),
  cars integer not null default 0,
  motorcycles integer not null default 0,
  trucks integer not null default 0,
  others integer not null default 0,
  total integer not null generated always as (cars + motorcycles + trucks + others) stored,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_infraction_city_year_month on public.traffic_infractions(city,year,month);
create index if not exists idx_infraction_created_at on public.traffic_infractions(created_at desc);

drop trigger if exists tr_traffic_infractions_updated_at on public.traffic_infractions;
create trigger tr_traffic_infractions_updated_at before update on public.traffic_infractions
for each row execute procedure public.set_timestamp();

create table if not exists public.productivity_records (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  month smallint not null check (month between 0 and 11),
  year integer not null check (year between 2000 and 2100),
  ba integer not null default 0,
  cop integer not null default 0,
  tc integer not null default 0,
  fugitives integer not null default 0,
  vehicles_inspected integer not null default 0,
  people_approached integer not null default 0,
  drugs_kg numeric(12,3) not null default 0,
  weapons integer not null default 0,
  arrests integer not null default 0,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prod_city_year_month on public.productivity_records(city,year,month);
create index if not exists idx_prod_created_at on public.productivity_records(created_at desc);

drop trigger if exists tr_productivity_records_updated_at on public.productivity_records;
create trigger tr_productivity_records_updated_at before update on public.productivity_records
for each row execute procedure public.set_timestamp();

create or replace view public.v_ait_monthly_totals as
select city, year, month,
       sum(cars) as cars,
       sum(motorcycles) as motorcycles,
       sum(trucks) as trucks,
       sum(others) as others,
       sum(total) as total
from public.traffic_infractions
group by city, year, month;

create or replace view public.v_productivity_monthly as
select city, year, month,
       sum(ba) as ba,
       sum(cop) as cop,
       sum(tc) as tc,
       sum(fugitives) as fugitives,
       sum(vehicles_inspected) as vehicles_inspected,
       sum(people_approached) as people_approached,
       sum(drugs_kg) as drugs_kg,
       sum(weapons) as weapons,
       sum(arrests) as arrests
from public.productivity_records
group by city, year, month;

create or replace view public.v_general_stats as
with latest_period as (
  select max(year*12 + month) as ym from public.traffic_infractions
),
current_ym as (
  select (ym/12)::int as year, (ym % 12)::int as month from latest_period
)
select
  (select count(*) from public.app_users) as users_total,
  (select count(*) from public.traffic_infractions) as ait_total_registros,
  (select count(*) from public.productivity_records) as prod_total_registros,
  (select sum(total) from public.traffic_infractions) as ait_total_geral,
  (select sum(arrests) from public.productivity_records) as prod_total_prisoes,
  (select jsonb_build_object('year', year, 'month', month) from current_ym) as periodo_mais_recente;

alter table public.app_users enable row level security;
alter table public.traffic_infractions enable row level security;
alter table public.productivity_records enable row level security;

drop policy if exists "app_users_select_own_or_admin" on public.app_users;
create policy "app_users_select_own_or_admin"
on public.app_users for select
using (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.role = 'ADMIN'
  )
);

drop policy if exists "app_users_update_own_or_admin" on public.app_users;
create policy "app_users_update_own_or_admin"
on public.app_users for update
using (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.role = 'ADMIN'
  )
);

drop policy if exists "infraction_select_authenticated" on public.traffic_infractions;
create policy "infraction_select_authenticated"
on public.traffic_infractions for select
to authenticated
using (true);

drop policy if exists "infraction_insert_user" on public.traffic_infractions;
create policy "infraction_insert_user"
on public.traffic_infractions for insert
to authenticated
with check (
  created_by is null
  or created_by in (select id from public.app_users where auth_user_id = auth.uid())
);

drop policy if exists "infraction_update_owner_or_admin" on public.traffic_infractions;
create policy "infraction_update_owner_or_admin"
on public.traffic_infractions for update
to authenticated
using (
  (created_by in (select id from public.app_users where auth_user_id = auth.uid()))
  or exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.role = 'ADMIN'
  )
);

drop policy if exists "prod_select_authenticated" on public.productivity_records;
create policy "prod_select_authenticated"
on public.productivity_records for select
to authenticated
using (true);

drop policy if exists "prod_insert_user" on public.productivity_records;
create policy "prod_insert_user"
on public.productivity_records for insert
to authenticated
with check (
  created_by is null
  or created_by in (select id from public.app_users where auth_user_id = auth.uid())
);

drop policy if exists "prod_update_owner_or_admin" on public.productivity_records;
create policy "prod_update_owner_or_admin"
on public.productivity_records for update
to authenticated
using (
  (created_by in (select id from public.app_users where auth_user_id = auth.uid()))
  or exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.role = 'ADMIN'
  )
);

-- Admin auto-promotion setup
create table if not exists public.admin_emails (
  email text primary key
);

-- Seed requested admin email
insert into public.admin_emails(email)
values ('lucasm.guedes@yahoo.com.br')
on conflict do nothing;

-- Trigger to promote app_users to ADMIN if their auth email is listed
create or replace function public.promote_admin_if_listed()
returns trigger language plpgsql as $$
begin
  -- Ensure defaults
  if new.role is null then new.role := 'USER'; end if;
  if exists (
    select 1
    from auth.users u
    join public.admin_emails ae on ae.email = u.email
    where u.id = new.auth_user_id
  ) then
    new.role := 'ADMIN';
    if new.rank is null then new.rank := 'Ten Cel'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_app_users_promote_admin on public.app_users;
create trigger tr_app_users_promote_admin
before insert on public.app_users
for each row execute procedure public.promote_admin_if_listed();

-- Backfill existing profiles to ADMIN when email is listed
update public.app_users au
set role = 'ADMIN', rank = coalesce(au.rank, 'Ten Cel')
where au.auth_user_id in (
  select u.id from auth.users u join public.admin_emails ae on ae.email = u.email
);

-- Add email column to app_users (for linking profiles by email)
alter table if exists public.app_users
  add column if not exists email text unique;

-- Helper to check ADMIN by JWT email (no auth.users required)
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.admin_emails ae
    where ae.email = (auth.jwt() ->> 'email')
  );
$$;

-- Allow DELETE by owner or admin on traffic_infractions
drop policy if exists "infraction_delete_owner_or_admin" on public.traffic_infractions;
create policy "infraction_delete_owner_or_admin"
on public.traffic_infractions for delete
to authenticated
using (
  (created_by in (select id from public.app_users where auth_user_id = auth.uid()))
  or public.is_admin()
);

-- Optional: productivity delete as well (keep symmetric behaviors)
drop policy if exists "prod_delete_owner_or_admin" on public.productivity_records;
create policy "prod_delete_owner_or_admin"
on public.productivity_records for delete
to authenticated
using (
  (created_by in (select id from public.app_users where auth_user_id = auth.uid()))
  or public.is_admin()
);

-- PostgREST schema cache reload hint
notify pgrst, 'reload schema';
