-- 🔧 LIMPEZA COMPLETA E RECONSTRUÇÃO DE POLÍTICAS
-- Execute este script para resolver conflitos de políticas existentes

-- 1. Remover TODAS as políticas existentes da app_users (força limpeza)
DROP POLICY IF EXISTS "app_users_select_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_self" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin_only" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin" ON public.app_users;

-- 2. Remover função auxiliar se existir
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- 3. Aguarde um momento para garantir limpeza
SELECT pg_sleep(0.1);

-- 4. Criar função auxiliar para verificar admin (sem recursão)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_emails ae 
    WHERE ae.email = auth.jwt() ->> 'email'
  );
$$;

-- 5. Criar políticas corrigidas SEM recursão

-- Política SELECT: usuário pode ver próprio perfil, admins podem ver todos
CREATE POLICY "app_users_select_own_or_admin"
ON public.app_users FOR SELECT
TO authenticated
USING (
  auth.uid() = auth_user_id  -- Próprio perfil
  OR public.is_current_user_admin()  -- Admins podem ver todos
);

-- Política INSERT: qualquer usuário autenticado pode criar próprio perfil
CREATE POLICY "app_users_insert_self"
ON public.app_users FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = auth_user_id  -- Só pode criar perfil com próprio auth_user_id
);

-- Política UPDATE: usuário pode atualizar próprio perfil, admins podem atualizar todos
CREATE POLICY "app_users_update_own_or_admin"
ON public.app_users FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_user_id  -- Próprio perfil
  OR public.is_current_user_admin()  -- Admins podem atualizar todos
);

-- Política DELETE: apenas admins podem deletar
CREATE POLICY "app_users_delete_admin_only"
ON public.app_users FOR DELETE
TO authenticated
USING (
  public.is_current_user_admin()  -- Apenas admins
);

-- 6. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'app_users' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 7. Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 8. Testar função auxiliar
SELECT public.is_current_user_admin() as is_admin;

-- 9. Verificar se RLS está ativo
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'app_users';

-- 10. Mensagem de sucesso
SELECT '✅ Políticas recriadas com sucesso! Sem recursão infinita.' as status;
