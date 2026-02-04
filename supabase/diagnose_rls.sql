-- 🔍 DIAGNÓSTICO DE PERMISSÕES RLS
-- Execute este script para verificar o status das políticas

-- 1. Verificar status do RLS nas tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('app_users', 'traffic_infractions', 'productivity_records');

-- 2. Verificar políticas existentes para app_users
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_condition,
  with_check
FROM pg_policies 
WHERE tablename = 'app_users' 
  AND schemaname = 'public';

-- 3. Verificar se usuário atual está autenticado
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_email,
  auth.role() as current_role;

-- 4. Testar criação de usuário (simulação)
-- Descomente para testar (substitua com dados reais)
/*
INSERT INTO public.app_users (auth_user_id, username, role, rank)
VALUES (
  auth.uid(),
  'test_user',
  'USER',
  'Sd'
);
*/

-- 5. Verificar tabela admin_emails
SELECT * FROM public.admin_emails;
