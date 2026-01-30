-- 🔧 SCRIPT PARA CORRIGIR POLÍTICAS RLS - APP_USERS
-- Execute este script no SQL Editor do Supabase

-- 1. Política INSERT para app_users (ESTAVA FALTANDO)
drop policy if exists "app_users_insert_self" on public.app_users;
create policy "app_users_insert_self"
on public.app_users for insert
to authenticated
with check (
  auth.uid() = auth_user_id
);

-- 2. Política DELETE para app_users (para admins)
drop policy if exists "app_users_delete_admin" on public.app_users;
create policy "app_users_delete_admin"
on public.app_users for delete
to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.role = 'ADMIN'
  )
);

-- 3. Verificar se RLS está ativo
alter table public.app_users enable row level security;

-- 4. Recarregar cache do PostgREST
notify pgrst, 'reload schema';

-- 5. Verificar políticas existentes
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename = 'app_users';
