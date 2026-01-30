# 🚨 Guia - Erros HTTP 403 e 406 do Supabase

## ❌ **Erros Identificados:**

```
Failed to load resource: the server responded with a status of 406 ()
jqtwqttcuaegutdbavzz.supabase.co/rest/v1/app_users?select=id%2Cusername%2Crole%2Crank&email=eq.exemplo1%40gmail.com

Failed to load resource: the server responded with a status of 403 ()
jqtwqttcuaegutdbavzz.supabase.co/rest/v1/app_users?select=id%2Cusername%2Crole%2Crank
```

## 🔍 **Análise dos Erros:**

### **Erro 406 (Not Acceptable):**
- **Causa**: Formato da requisição não aceito pelo servidor
- **Motivo**: Geralmente relacionado a headers `Accept` incorretos
- **URL afetada**: Busca por email específico

### **Erro 403 (Forbidden):**
- **Causa**: Permissões RLS bloqueando acesso
- **Motivo**: Políticas não permitem a operação
- **URL afetada**: Busca geral de usuários

## 🚀 **Solução Imediata:**

### **Passo 1: Executar Script de Correção**
```sql
-- Execute no SQL Editor do Supabase:
-- supabase/fix_403_406_errors.sql
```

### **Passo 2: Verificar Arquivo .env**
```env
VITE_SUPABASE_URL=https://jqtwqttcuaegutdbavzz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Passo 3: Reiniciar Aplicação**
```bash
npm run dev
```

---

## 🔧 **O que o Script de Correção Faz:**

### 1. **Limpeza Completa**
- Remove todas as políticas antigas
- Desabilita RLS temporariamente

### 2. **Estrutura Correta**
- Verifica se colunas `email` e `auth_user_id` existem
- Garante estrutura completa da tabela

### 3. **Políticas Corrigidas**
- **SELECT**: Próprio perfil + busca por email
- **INSERT**: Apenas próprio perfil
- **UPDATE**: Próprio perfil + linking por email
- **DELETE**: Apenas próprio perfil

### 4. **Permissões Explícitas**
- `GRANT ALL ON app_users TO authenticated`
- `GRANT SELECT ON app_users TO anon`

### 5. **Sistema de Admin**
- Configura `admin_emails`
- Cria trigger de promoção automática

---

## 🧪 **Testes Após Correção:**

### **Teste 1: Diagnóstico**
```sql
SELECT auth.uid() as user_id, auth.jwt() ->> 'email' as email;
```

### **Teste 2: Verificar Políticas**
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'app_users';
```

### **Teste 3: Inserção Manual**
```sql
INSERT INTO public.app_users (auth_user_id, username, email, role, rank)
VALUES (auth.uid(), 'test', 'test@example.com', 'USER', 'Sd');
```

---

## 🐛 **Soluções Alternativas:**

### **Opção A: Desabilitar RLS Temporariamente**
```sql
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
```
⚠️ **Apenas para teste!**

### **Opção B: Política Universal**
```sql
CREATE POLICY "allow_all" ON public.app_users
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
⚠️ **Apenas para desenvolvimento!**

### **Opção C: Verificar Headers da Requisição**
```javascript
// No console do navegador
fetch('/rest/v1/app_users', {
  headers: {
    'Accept': 'application/json',
    'apikey': 'sua-chave',
    'Authorization': 'Bearer seu-token'
  }
});
```

---

## 📊 **Causas Comuns:**

### **1. Políticas Muito Restritivas**
- Políticas não permitem operações necessárias
- Faltam políticas para operações específicas

### **2. Headers Incorretos**
- `Accept` header não inclui `application/json`
- Falta `apikey` ou `Authorization`

### **3. RLS Mal Configurado**
- RLS habilitado sem políticas adequadas
- Políticas com recursão infinita

### **4. Estrutura da Tabela**
- Colunas faltando (`email`, `auth_user_id`)
- Tipos de dados incorretos

---

## ✅ **Checklist de Verificação:**

- [ ] Executar `fix_403_406_errors.sql`
- [ ] Verificar arquivo `.env`
- [ ] Reiniciar aplicação
- [ ] Testar cadastro novo usuário
- [ ] Verificar console do navegador
- [ ] Testar login após cadastro
- [ ] Verificar usuário no Supabase Auth

---

## 🎯 **Resultado Esperado:**

Após executar o script:
- ✅ Sem erros 403/406
- ✅ Cadastro funciona
- ✅ Login automático
- ✅ Busca por email funciona
- ✅ Sistema operacional

**Execute o script de correção e os erros HTTP serão resolvidos!** 🚀
