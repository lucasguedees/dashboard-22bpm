# 🚨 ERRO: Infinite Recursion Detected in Policy

## ❌ **Problema Identificado**

```
infinite recursion detected in policy for relation "app_users"
```

Este erro ocorre quando as políticas RLS tentam consultar a mesma tabela que estão protegendo, criando um loop infinito.

## 🔍 **Causa Raiz**

As políticas originais continham:
```sql
exists (
  select 1 from public.app_users au  -- ❌ CONSULTANDO A MESMA TABELA
  where au.auth_user_id = auth.uid() and au.role = 'ADMIN'
)
```

## ✅ **SOLUÇÃO IMEDIATA**

### Passo 1: Executar Script de Correção
1. Abra o **SQL Editor** do Supabase
2. Copie e cole o conteúdo do arquivo: `supabase/fix_recursion_policies.sql`
3. Clique em **Run**

### Passo 2: Verificar se Funcionou
Execute este comando para confirmar:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'app_users';
```

Deve retornar 4 políticas sem erros.

---

## 🔧 **O que o Script de Correção Faz:**

### 1. **Remove Políticas Problemáticas**
- Elimina todas as políticas que causam recursão

### 2. **Cria Função Auxiliar**
```sql
create function public.is_current_user_admin()
```
- Verifica admin usando `admin_emails` (sem tocar em `app_users`)
- Usa `security definer` para evitar RLS
- Retorna boolean simples

### 3. **Políticas Corrigidas**
- **SELECT**: Próprio perfil OU admin
- **INSERT**: Apenas próprio perfil
- **UPDATE**: Próprio perfil OU admin  
- **DELETE**: Apenas admins

---

## 🧪 **Teste Após Correção**

### 1. Testar Função Auxiliar
```sql
SELECT public.is_current_user_admin() as is_admin;
```

### 2. Testar Inserção Manual
```sql
INSERT INTO public.app_users (auth_user_id, username, role, rank)
VALUES (auth.uid(), 'test_user', 'USER', 'Sd');
```

### 3. Testar Seleção
```sql
SELECT * FROM public.app_users WHERE auth_user_id = auth.uid();
```

---

## 🎯 **Por que Isso Funciona:**

### ❌ **Antes (Com Recursão):**
```
Policy → SELECT app_users → RLS → Policy → SELECT app_users → ♾️
```

### ✅ **Depois (Sem Recursão):**
```
Policy → is_current_user_admin() → admin_emails → ✅
```

---

## 🆘 **Se Ainda Tiver Erros:**

### 1. Limpar Cache
```sql
NOTIFY pgrst, 'reload schema';
```

### 2. Verificar Conexão
```sql
SELECT auth.uid(), auth.role();
```

### 3. Desabilitar RLS Temporariamente
```sql
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
```
⚠️ **Apenas para diagnóstico!**

---

## 📋 **Checklist Final:**

- [ ] Executar `fix_recursion_policies.sql`
- [ ] Verificar políticas criadas
- [ ] Testar função `is_current_user_admin()`
- [ ] Testar cadastro na aplicação
- [ ] Confirmar sem erros de recursão

**Após executar o script, o sistema de cadastro deve funcionar normalmente!** 🎉
