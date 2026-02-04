-- 🔧 CORRIGIR ERRO DE PERMISSÃO
-- Execute este script para resolver "permission denied for table users"

-- 1. Remover políticas existentes (limpeza)
DROP POLICY IF EXISTS "app_users_select_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_self" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin_only" ON public.app_users;

-- 2. Remover função auxiliar se existir
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- 3. Garantir que admin_emails tem permissões corretas
GRANT SELECT ON public.admin_emails TO authenticated;
GRANT SELECT ON public.admin_emails TO anon;

-- 4. Criar função auxiliar com permissões explícitas
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Mudado para INVOKER em vez de DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_emails ae 
    WHERE ae.email = COALESCE(auth.jwt() ->> 'email', '')
  );
$$;

-- 5. Criar políticas simplificadas (sem dependência de função complexa)

-- Política SELECT: usuário pode ver próprio perfil
CREATE POLICY "app_users_select_own"
ON public.app_users FOR SELECT
TO authenticated
USING (
  auth.uid() = auth_user_id
);

-- Política SELECT adicional: admins podem ver todos (via JWT check)
CREATE POLICY "app_users_select_admins"
ON public.app_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.admin_emails ae 
    WHERE ae.email = auth.jwt() ->> 'email'
  )
);

-- Política INSERT: usuário pode criar próprio perfil
CREATE POLICY "app_users_insert_own"
ON public.app_users FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = auth_user_id
);

-- Política UPDATE: usuário pode atualizar próprio perfil
CREATE POLICY "app_users_update_own"
ON public.app_users FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_user_id
);

-- Política UPDATE adicional: admins podem atualizar todos
CREATE POLICY "app_users_update_admins"
ON public.app_users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.admin_emails ae 
    WHERE ae.email = auth.jwt() ->> 'email'
  )
);

-- Política DELETE: apenas admins podem deletar
CREATE POLICY "app_users_delete_admins"
ON public.app_users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.admin_emails ae 
    WHERE ae.email = auth.jwt() ->> 'email'
  )
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

-- 7. Recarregar cache
NOTIFY pgrst, 'reload schema';

-- 8. Testar permissão na admin_emails
SELECT 'Testing admin_emails access...' as test;
SELECT COUNT(*) as admin_count FROM public.admin_emails;

-- 9. Verificar usuário atual
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_email,
  auth.role() as current_role;

-- 10. Mensagem de sucesso
SELECT '✅ Permissões corrigidas! Teste o cadastro agora.' as status;
