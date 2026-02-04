-- 🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE CADASTRO
-- Execute este script para verificar TODOS os problemas

-- 1. Verificar configuração básica
SELECT '=== DIAGNÓSTICO COMPLETO ===' as section;
SELECT '1. Verificando tabelas...' as step;

-- 2. Verificar se tabelas existem
SELECT 
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('app_users', 'admin_emails', 'traffic_infractions', 'productivity_records')
ORDER BY tablename;

-- 3. Verificar estrutura da app_users
SELECT '2. Estrutura da app_users:' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'app_users'
ORDER BY ordinal_position;

-- 4. Verificar RLS status
SELECT '3. Status RLS:' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'app_users';

-- 5. Verificar políticas atuais
SELECT '4. Políticas atuais:' as step;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_condition,
  with_check
FROM pg_policies 
WHERE tablename = 'app_users' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 6. Verificar admin_emails
SELECT '5. Admin emails configurados:' as step;
SELECT * FROM public.admin_emails;

-- 7. Verificar usuário atual
SELECT '6. Usuário autenticado:' as step;
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_email,
  auth.role() as current_role,
  auth.jwt() ->> 'app_metadata' as app_metadata;

-- 8. Testar permissão SELECT
SELECT '7. Testando SELECT em app_users:' as step;
SELECT COUNT(*) as total_users FROM public.app_users;

-- 9. Testar permissão INSERT (simulação)
SELECT '8. Testando INSERT (simulação):' as step;
-- Este comando vai falhar se não tiver permissão
SELECT 'INSERT permission check...' as test;

-- 10. Verificar triggers
SELECT '9. Triggers na app_users:' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'app_users';

-- 11. Verificar funções
SELECT '10. Funções auxiliares:' as step;
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%admin%';

-- 12. Testar conexão
SELECT '11. Teste de conexão:' as step;
SELECT 
  current_database() as database,
  current_user as user,
  version() as postgres_version;

-- 13. Resumo do diagnóstico
SELECT '=== RESUMO DO DIAGNÓSTICO ===' as section;
SELECT 
  'Tabelas existentes: ' || COUNT(*) as info
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('app_users', 'admin_emails');

SELECT 
  'Políticas RLS: ' || COUNT(*) as info
FROM pg_policies 
WHERE tablename = 'app_users' 
  AND schemaname = 'public';

SELECT 
  'Admin emails: ' || COUNT(*) as info
FROM public.admin_emails;

SELECT '=== FIM DO DIAGNÓSTICO ===' as section;
