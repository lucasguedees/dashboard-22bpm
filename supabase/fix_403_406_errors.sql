-- 🔧 CORRIGIR ERROS 403 E 406 DO SUPABASE
-- Execute este script para resolver os erros de permissão e formato

-- 1. Remover todas as políticas existentes (limpeza completa)
DROP POLICY IF EXISTS "app_users_select_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own_or_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_self" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admin_only" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_admins" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_own" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_admins" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_admins" ON public.app_users;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- 3. Garantir que a tabela tem estrutura correta
DO $$
BEGIN
    -- Verificar se coluna email existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN email text unique;
    END IF;
    
    -- Verificar se coluna auth_user_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN auth_user_id uuid unique references auth.users(id) on delete cascade;
    END IF;
END $$;

-- 4. Reabilitar RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas PERMISSIVAS para resolver 403/406

-- Política SELECT: Permitir que usuários autenticados vejam próprios dados
CREATE POLICY "app_users_select_own"
ON public.app_users FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Política SELECT adicional: Permitir busca por email (para linking)
CREATE POLICY "app_users_select_by_email"
ON public.app_users FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = email);

-- Política INSERT: Permitir que usuários criem próprio perfil
CREATE POLICY "app_users_insert_own"
ON public.app_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- Política UPDATE: Permitir que usuários atualizem próprio perfil
CREATE POLICY "app_users_update_own"
ON public.app_users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- Política UPDATE adicional: Permitir linking por email
CREATE POLICY "app_users_update_by_email"
ON public.app_users FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = email);

-- Política DELETE: Permitir que usuários deletem próprio perfil
CREATE POLICY "app_users_delete_own"
ON public.app_users FOR DELETE
TO authenticated
USING (auth.uid() = auth_user_id);

-- 6. Garantir permissões explícitas
GRANT ALL ON public.app_users TO authenticated;
GRANT SELECT ON public.app_users TO anon;  -- Para leitura básica se necessário

-- 7. Configurar admin_emails se não existir
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text primary key
);

-- Inserir email admin
INSERT INTO public.admin_emails(email)
VALUES ('lucasm.guedes@yahoo.com.br')
ON CONFLICT (email) DO NOTHING;

-- 8. Garantir permissões na admin_emails
GRANT SELECT ON public.admin_emails TO authenticated;
GRANT SELECT ON public.admin_emails TO anon;

-- 9. Criar trigger de promoção de admin
CREATE OR REPLACE FUNCTION public.promote_admin_if_listed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Defaults
  IF new.role IS NULL THEN new.role := 'USER'; END IF;
  IF new.rank IS NULL THEN new.rank := 'Sd'; END IF;
  
  -- Promover se email está na lista
  IF EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.admin_emails ae ON ae.email = u.email
    WHERE u.id = new.auth_user_id
  ) THEN
    new.role := 'ADMIN';
    new.rank := COALESCE(new.rank, 'Ten Cel');
  END IF;
  
  RETURN new;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS tr_app_users_promote_admin ON public.app_users;
CREATE TRIGGER tr_app_users_promote_admin
BEFORE INSERT ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.promote_admin_if_listed();

-- 10. Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 11. Verificar configuração
SELECT '=== VERIFICAÇÃO FINAL ===' as section;

SELECT 'Políticas criadas:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'app_users' ORDER BY cmd, policyname;

SELECT 'Estrutura da tabela:' as info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'app_users' ORDER BY ordinal_position;

SELECT 'Permissões:' as info;
SELECT grantee, privilege_type FROM information_schema.role_table_grants 
WHERE table_name = 'app_users' AND table_schema = 'public';

SELECT 'Usuário atual:' as info;
SELECT auth.uid() as user_id, auth.jwt() ->> 'email' as email, auth.role() as role;

SELECT '=== CONFIGURAÇÃO CONCLUÍDA! ===' as section;
SELECT 'Agora teste o cadastro novamente.' as next_step;
