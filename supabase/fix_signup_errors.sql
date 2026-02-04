-- 🔧 CORRIGIR ERROS 422, 406 E 403 - CADASTRO COMPLETO
-- Execute este script para resolver TODOS os erros de cadastro

-- 1. Remover TODAS as políticas existentes (limpeza completa)
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
DROP POLICY IF EXISTS "app_users_select_by_email" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_by_email" ON public.app_users;

-- 2. Desabilitar RLS temporariamente para limpeza
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- 3. Garantir estrutura completa da tabela
DO $$
BEGIN
    -- Verificar e adicionar colunas se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN id uuid primary key default gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN auth_user_id uuid unique references auth.users(id) on delete cascade;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN username text not null;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN email text unique;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN role text not null check (role in ('ADMIN','COMANDO','USER'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'rank'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN rank text not null;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN created_at timestamptz not null default now();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN updated_at timestamptz not null default now();
    END IF;
END $$;

-- 4. Reabilitar RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas SIMPLES E FUNCIONAIS

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

-- 6. Garantir permissões completas
GRANT ALL ON public.app_users TO authenticated;
GRANT SELECT ON public.app_users TO anon;

-- 7. Configurar admin_emails
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text primary key
);

INSERT INTO public.admin_emails(email)
VALUES ('lucasm.guedes@yahoo.com.br')
ON CONFLICT (email) DO NOTHING;

GRANT SELECT ON public.admin_emails TO authenticated;
GRANT SELECT ON public.admin_emails TO anon;

-- 8. Criar trigger de promoção (sem recursão)
CREATE OR REPLACE FUNCTION public.promote_admin_if_listed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Defaults
  IF new.role IS NULL THEN new.role := 'USER'; END IF;
  IF new.rank IS NULL THEN new.rank := 'Sd'; END IF;
  
  -- Promover se email está na lista (sem consultar app_users)
  IF EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = new.auth_user_id
    AND u.email IN (SELECT email FROM public.admin_emails)
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

-- 9. Criar função de timestamp
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Criar trigger de timestamp
DROP TRIGGER IF EXISTS tr_app_users_updated_at ON public.app_users;
CREATE TRIGGER tr_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- 10. Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 11. Verificar configuração final
SELECT '=== VERIFICAÇÃO FINAL ===' as section;

SELECT 'Estrutura da tabela:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
ORDER BY ordinal_position;

SELECT 'Políticas criadas:' as info;
SELECT policyname, cmd, roles, permissive 
FROM pg_policies 
WHERE tablename = 'app_users' 
ORDER BY cmd, policyname;

SELECT 'Permissões:' as info;
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'app_users' 
AND table_schema = 'public';

SELECT 'Admin emails:' as info;
SELECT * FROM public.admin_emails;

SELECT 'Usuário atual:' as info;
SELECT 
  auth.uid() as user_id, 
  auth.jwt() ->> 'email' as email, 
  auth.role() as role;

SELECT '=== CONFIGURAÇÃO CONCLUÍDA! ===' as section;
SELECT 'Agora teste o cadastro novamente.' as next_step;
