-- 🔧 SOLUÇÃO COMPLETA PARA CADASTRO DE USUÁRIOS
-- Execute este script APÓS o diagnóstico para corrigir TUDO

-- 1. Limpar completamente as políticas
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

-- 2. Garantir que RLS está desabilitado temporariamente
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- 3. Garantir que a tabela tem a estrutura correta
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

-- 5. Criar políticas SIMPLES e FUNCIONAIS

-- Política SELECT: Usuário pode ver próprio registro
CREATE POLICY "app_users_select_own"
ON public.app_users FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Política INSERT: Usuário pode inserir próprio registro
CREATE POLICY "app_users_insert_own"
ON public.app_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- Política UPDATE: Usuário pode atualizar próprio registro
CREATE POLICY "app_users_update_own"
ON public.app_users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- Política DELETE: Usuário pode deletar próprio registro
CREATE POLICY "app_users_delete_own"
ON public.app_users FOR DELETE
TO authenticated
USING (auth.uid() = auth_user_id);

-- 6. Garantir que admin_emails existe e tem dados
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text primary key
);

-- Inserir seu email como admin (se não existir)
INSERT INTO public.admin_emails(email)
VALUES ('lucasm.guedes@yahoo.com.br')
ON CONFLICT (email) DO NOTHING;

-- 7. Criar trigger de promoção de admin (se não existir)
CREATE OR REPLACE FUNCTION public.promote_admin_if_listed()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Ensure defaults
  IF new.role IS NULL THEN new.role := 'USER'; END IF;
  IF new.rank IS NULL THEN new.rank := 'Sd'; END IF;
  
  -- Promote to admin if email is listed
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

-- 8. Garantir permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO authenticated;
GRANT SELECT ON public.admin_emails TO authenticated;

-- 9. Recarregar cache
NOTIFY pgrst, 'reload schema';

-- 10. Verificar configuração final
SELECT '=== VERIFICAÇÃO FINAL ===' as section;

SELECT 'Políticas criadas:' as check_name;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'app_users' ORDER BY cmd, policyname;

SELECT 'Admin emails configurados:' as check_name;
SELECT * FROM public.admin_emails;

SELECT 'Estrutura da app_users:' as check_name;
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'app_users' ORDER BY ordinal_position;

SELECT 'Teste de usuário atual:' as check_name;
SELECT auth.uid() as user_id, auth.jwt() ->> 'email' as email;

SELECT '=== CONFIGURAÇÃO CONCLUÍDA! ===' as section;
SELECT 'Agora teste o cadastro na aplicação.' as next_step;
