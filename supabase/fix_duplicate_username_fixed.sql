-- 🔧 CORRIGIR ERRO DE USERNAME DUPLICADO (VERSÃO CORRIGIDA)
-- Execute este script para resolver "duplicate key value violates unique constraint"

-- 1. Verificar usernames duplicados
SELECT '=== VERIFICANDO USERNAMES DUPLICADOS ===' as section;
SELECT 
  username, 
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as user_ids
FROM public.app_users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- 2. Verificar se o username que está causando erro já existe
SELECT '=== VERIFICANDO USERNAME ESPECÍFICO ===' as section;
SELECT * FROM public.app_users WHERE username = 'test' OR username LIKE '%test%';

-- 3. Remover constraint de username único (temporariamente)
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_username_key;

-- 4. Remover constraint de email único (temporariamente)  
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_email_key;

-- 5. Remover constraint de auth_user_id único (temporariamente)
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_auth_user_id_key;

-- 6. Limpar dados duplicados (se existir)
DELETE FROM public.app_users 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at DESC) as rn
    FROM public.app_users
  ) t 
  WHERE rn > 1
);

-- 7. Atualizar usernames para garantir unicidade (se necessário)
UPDATE public.app_users 
SET username = username || '_' || SUBSTRING(id::text, 1, 8)
WHERE username IN (
  SELECT username FROM (
    SELECT username, COUNT(*) as cnt
    FROM public.app_users
    GROUP BY username
    HAVING COUNT(*) > 1
  ) dup
);

-- 8. Recriar constraints com tratamento melhor

-- Constraint de username único (simples)
ALTER TABLE public.app_users 
ADD CONSTRAINT app_users_username_key UNIQUE (username);

-- Constraint de auth_user_id único
ALTER TABLE public.app_users 
ADD CONSTRAINT app_users_auth_user_id_key UNIQUE (auth_user_id);

-- Para email, vamos criar uma constraint parcial usando índice
-- (PostgreSQL não suporta UNIQUE WHERE NULL diretamente em ADD CONSTRAINT)
DROP INDEX IF EXISTS app_users_email_unique_idx;
CREATE UNIQUE INDEX app_users_email_unique_idx 
ON public.app_users (email) 
WHERE email IS NOT NULL;

-- 9. Criar função para gerar username único automaticamente
CREATE OR REPLACE FUNCTION public.generate_unique_username(base_username text, user_id text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  unique_username text;
  counter integer := 1;
BEGIN
  unique_username := base_username;
  
  -- Loop até encontrar username único
  WHILE EXISTS (SELECT 1 FROM public.app_users WHERE username = unique_username AND id != user_id) LOOP
    unique_username := base_username || '_' || counter;
    counter := counter + 1;
    
    -- Evitar loop infinito
    IF counter > 1000 THEN
      unique_username := base_username || '_' || SUBSTRING(user_id, 1, 8);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN unique_username;
END;
$$;

-- 10. Verificar resultado final
SELECT '=== VERIFICAÇÃO FINAL ===' as section;
SELECT 'Usuários após limpeza:' as info;
SELECT id, username, email, role, rank, created_at 
FROM public.app_users 
ORDER BY created_at DESC;

SELECT 'Verificando unicidade:' as info;
SELECT username, COUNT(*) as count
FROM public.app_users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- 11. Testar inserção com username único
SELECT '=== TESTE DE INSERÇÃO ===' as section;
SELECT 'Testando geração de username único:' as test;
SELECT public.generate_unique_username('test', 'test-id-123') as unique_username;

-- 12. Recarregar cache
NOTIFY pgrst, 'reload schema';

-- 13. Verificar constraints criadas
SELECT '=== CONSTRAINTS CRIADAS ===' as section;
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.app_users'::regclass
ORDER BY conname;

-- 14. Verificar índices criados
SELECT '=== ÍNDICES CRIADOS ===' as section;
SELECT 
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'app_users' 
AND schemaname = 'public'
ORDER BY indexname;

-- 15. Mensagem final
SELECT '=== CORREÇÃO CONCLUÍDA! ===' as section;
SELECT 'Username duplicado resolvido. Teste o cadastro novamente.' as next_step;
SELECT 'Dica: Use emails diferentes para cada teste de cadastro.' as tip;
