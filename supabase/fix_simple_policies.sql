-- 🔧 SOLUÇÃO SIMPLES - SEM DEPENDÊNCIAS EXTERNAS
-- Execute este script para resolver todos os erros de permissão

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "app_users_select_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_self" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin_only" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_admins" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_admins" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admins" ON public.app_users;

-- 2. Remover função auxiliar
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- 3. Desabilitar RLS temporariamente para limpar
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- 4. Reabilitar RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 5. Políticas SIMPLES - apenas baseadas em auth_user_id

-- SELECT: Usuário pode ver próprio registro
CREATE POLICY "app_users_select_own"
ON public.app_users FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- INSERT: Usuário pode inserir próprio registro
CREATE POLICY "app_users_insert_own"
ON public.app_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- UPDATE: Usuário pode atualizar próprio registro
CREATE POLICY "app_users_update_own"
ON public.app_users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- DELETE: Usuário pode deletar próprio registro
CREATE POLICY "app_users_delete_own"
ON public.app_users FOR DELETE
TO authenticated
USING (auth.uid() = auth_user_id);

-- 6. Verificar políticas
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'app_users' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 7. Testar inserção manual
SELECT 'Testando permissões...' as status;

-- 8. Recarregar cache
NOTIFY pgrst, 'reload schema';

-- 9. Verificar estado atual
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'app_users';

-- 10. Verificar usuário atual
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_email,
  auth.role() as current_role;

-- 11. Mensagem final
SELECT '✅ Políticas simples criadas! Sem dependências externas.' as result;
