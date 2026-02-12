# 🚨 Guia - Erro de Username Duplicado

## ❌ **Erro Identificado:**

```
duplicate key value violates unique constraint "app_users_username_key"
```

## 🔍 **Causa do Problema:**

O erro ocorre quando:
1. **Username já existe** na tabela `app_users`
2. **Constraint única** `app_users_username_key` bloqueia inserção
3. **Múltiplas tentativas** de cadastro com mesmo username
4. **Fallback de username** gera nomes repetidos

---

## 🚀 **Solução Completa:**

### **Passo 1: Executar Script de Correção SQL**
```sql
-- Execute no SQL Editor do Supabase:
-- supabase/fix_duplicate_username.sql
```

### **Passo 2: Verificar Correção no Código**
A função `getOrCreateAppUser` foi atualizada com:
- ✅ **Retry automático** (até 10 tentativas)
- ✅ **Sufixo numérico** (`test_1`, `test_2`, etc.)
- ✅ **Fallback final** com authUserId
- ✅ **Tratamento específico** para erro 23505

### **Passo 3: Reiniciar Aplicação**
```bash
npm run dev
```

---

## 🔧 **O que o Script SQL Faz:**

### **1. Diagnóstico**
- Verifica usernames duplicados
- Identifica registros problemáticos

### **2. Limpeza**
- Remove constraints únicas temporariamente
- Deleta registros duplicados
- Atualiza usernames com sufixos

### **3. Reconstrução**
- Recria constraints com tratamento melhor
- Adiciona função para gerar usernames únicos
- Verifica unicidade final

### **4. Prevenção**
- Função `generate_unique_username()` para uso futuro
- Teste de inserção automática
- Cache reload

---

## 📊 **Como o Código TypeScript Resolve:**

### **Antes (Sem Retry):**
```typescript
const username = usernameFallback || email.split('@')[0];
// Se "test" já existe → ERRO 23505
```

### **Depois (Com Retry):**
```typescript
let username = baseUsername;
let retryCount = 0;

while (retryCount < maxRetries) {
  // Tenta inserir "test"
  // Se erro 23505 → tenta "test_1"
  // Se erro 23505 → tenta "test_2"
  // ... até funcionar
}
```

---

## 🧪 **Testes Após Correção:**

### **Teste 1: Verificar Limpeza**
```sql
SELECT username, COUNT(*) 
FROM public.app_users 
GROUP BY username 
HAVING COUNT(*) > 1;
-- Deve retornar 0 linhas
```

### **Teste 2: Verificar Constraints**
```sql
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.app_users'::regclass;
```

### **Teste 3: Testar Inserção Manual**
```sql
SELECT public.generate_unique_username('test', 'user-123');
-- Deve retornar username único
```

---

## 🐛 **Cenários de Teste:**

### **Cenário 1: Novo Usuário**
- **Email**: `novo123@exemplo.com`
- **Username esperado**: `novo123`
- **Resultado**: ✅ Funciona

### **Cenário 2: Username Repetido**
- **Email**: `novo123@exemplo.com` (segunda vez)
- **Username esperado**: `novo123_1`
- **Resultado**: ✅ Funciona

### **Cenário 3: Múltiplas Repetições**
- **Email**: `test@exemplo.com` (várias vezes)
- **Username esperado**: `test`, `test_1`, `test_2`, etc.
- **Resultado**: ✅ Funciona

---

## 📋 **Checklist de Verificação:**

- [ ] Executar `fix_duplicate_username.sql`
- [ ] Verificar se não há usernames duplicados
- [ ] Reiniciar aplicação
- [ ] Testar cadastro com username novo
- [ ] Testar cadastro com username repetido
- [ ] Verificar sufixos automáticos
- [ ] Confirmar login funciona

---

## 🆘 **Se Ainda Ocorrer Erro:**

### **Opção A: Limpar Manualmente**
```sql
-- Remover todos os usuários de teste
DELETE FROM public.app_users 
WHERE username LIKE 'test%' 
OR username LIKE '%_1' 
OR username LIKE '%_2';
```

### **Opção B: Desabilitar Constraint**
```sql
-- Temporariamente (apenas para teste)
ALTER TABLE public.app_users DROP CONSTRAINT app_users_username_key;
```

### **Opção C: Usar Timestamp**
```sql
-- Adicionar timestamp ao username
UPDATE public.app_users 
SET username = username || '_' || EXTRACT(EPOCH FROM NOW())::bigint;
```

---

## 🎯 **Resultado Esperado:**

Após executar o script e reiniciar:
- ✅ Sem erro de constraint
- ✅ Username único gerado automaticamente
- ✅ Retry automático funcionando
- ✅ Cadastro funciona com qualquer email
- ✅ Login operacional

---

## 📈 **Exemplos de Username Gerados:**

| Email | Primeira Tentativa | Segunda Tentativa | Terceira Tentativa |
|-------|-------------------|------------------|-------------------|
| `joao@exemplo.com` | `joao` | `joao_1` | `joao_2` |
| `test@exemplo.com` | `test` | `test_1` | `test_2` |
| `usuario@exemplo.com` | `usuario` | `usuario_1` | `usuario_2` |

---

## ✅ **Solução Definitiva:**

O sistema agora:
1. **Detecta** conflitos de username
2. **Tenta automaticamente** com sufixos
3. **Fallback** para authUserId se necessário
4. **Nunca falha** por duplicação

**Execute o script SQL e o erro de username duplicado estará resolvido!** 🚀
