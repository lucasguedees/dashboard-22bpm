-- 🔧 CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- Execute este script para resolver o erro de recursão infinita

-- 1. Remover todas as políticas problemáticas da app_users
drop policy if exists "app_users_select_own_or_admin" on public.app_users;
drop policy if exists "app_users_update_own_or_admin" on public.app_users;
drop policy if exists "app_users_insert_self" on public.app_users;
drop policy if exists "app_users_delete_admin" on public.app_users;

-- 2. Criar função auxiliar para verificar se é admin (sem recursão)
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 
    from public.admin_emails ae 
    where ae.email = auth.jwt() ->> 'email'
  );
$$;

-- 3. Políticas corrigidas SEM recursão

-- Política SELECT: usuário pode ver próprio perfil, admins podem ver todos
create policy "app_users_select_own_or_admin"
on public.app_users for select
to authenticated
using (
  auth.uid() = auth_user_id  -- Próprio perfil
  or public.is_current_user_admin()  -- Admins podem ver todos
);

-- Política INSERT: qualquer usuário autenticado pode criar próprio perfil
create policy "app_users_insert_self"
on public.app_users for insert
to authenticated
with check (
  auth.uid() = auth_user_id  -- Só pode criar perfil com próprio auth_user_id
);

-- Política UPDATE: usuário pode atualizar próprio perfil, admins podem atualizar todos
create policy "app_users_update_own_or_admin"
on public.app_users for update
to authenticated
using (
  auth.uid() = auth_user_id  -- Próprio perfil
  or public.is_current_user_admin()  -- Admins podem atualizar todos
);

-- Política DELETE: apenas admins podem deletar
create policy "app_users_delete_admin_only"
on public.app_users for delete
to authenticated
using (
  public.is_current_user_admin()  -- Apenas admins
);

-- 4. Verificar políticas criadas
select 
  policyname,
  cmd,
  roles,
  permissive
from pg_policies 
where tablename = 'app_users' 
  and schemaname = 'public';

-- 5. Recarregar cache do PostgREST
notify pgrst, 'reload schema';

-- 6. Testar função auxiliar
select public.is_current_user_admin() as is_admin;
