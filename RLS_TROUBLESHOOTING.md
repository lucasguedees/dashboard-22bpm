# 🔧 Guia Rápido - Corrigir Erro de Permissões RLS

## ❌ Erro: "Falha ao criar usuário no Supabase. Verifique permissões RLS."

Este erro ocorre porque a tabela `app_users` não tem política de INSERT.

---

## 🚀 SOLUÇÃO RÁPIDA (3 passos)

### Passo 1: Executar Script de Correção
1. Abra o painel Supabase
2. Vá para **SQL Editor**
3. Copie e cole o conteúdo do arquivo `supabase/fix_rls_policies.sql`
4. Clique em **Run**

### Passo 2: Verificar se Funcionou
1. Execute o script `supabase/diagnose_rls.sql`
2. Confirme que a política `app_users_insert_self` aparece

### Passo 3: Testar Novamente
1. Reinicie a aplicação: `npm run dev`
2. Tente fazer login com um email novo
3. Deve funcionar agora! ✅

---

## 🔍 DIAGNÓSTICO DETALHADO

### O que estava faltando?
A tabela `app_users` tinha políticas para:
- ✅ SELECT (visualizar)
- ✅ UPDATE (atualizar)
- ❌ **INSERT** (criar) ← **ESTE ERA O PROBLEMA**

### Por que isso aconteceu?
Quando um novo usuário faz login, o sistema tenta:
1. Criar conta no Supabase Auth ✅
2. Inserir perfil em `app_users` ❌ (sem permissão)

---

## 🛠️ SOLUÇÕES ALTERNATIVAS

### Opção A: Desabilitar RLS Temporariamente
```sql
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
```
⚠️ **Não recomendado para produção**

### Opção B: Política Permissiva Temporária
```sql
CREATE POLICY "allow_all_inserts" ON public.app_users
FOR INSERT TO authenticated WITH CHECK (true);
```
⚠️ **Use apenas para teste**

---

## ✅ VERIFICAÇÃO FINAL

Execute este comando para confirmar:
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'app_users';
```

Deve retornar:
- `app_users_select_own_or_admin` | SELECT
- `app_users_update_own_or_admin` | UPDATE  
- `app_users_insert_self` | INSERT ← **NOVA**
- `app_users_delete_admin` | DELETE

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Verifique console do navegador** para erros detalhados
2. **Confirme que está autenticado**: `SELECT auth.uid();`
3. **Teste manualmente**:
   ```sql
   INSERT INTO public.app_users (auth_user_id, username, role, rank)
   VALUES ('test-id', 'test', 'USER', 'Sd');
   ```
4. **Reinicie o cache**: `NOTIFY pgrst, 'reload schema';`

---

## 📞 Contato

Se o problema persistir:
- Abra issue no GitHub
- Verifique logs do Supabase em **Settings > Logs**
- Confirme que `.env` está configurado corretamente
