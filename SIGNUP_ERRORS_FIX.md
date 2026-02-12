# 🚨 Guia - Erros 422, 406 e 403 no Cadastro

## ❌ **Erros Identificados:**

```
POST https://jqtwqttcuaegutdbavzz.supabase.co/auth/v1/signup 422 (Unprocessable Content)
GET https://jqtwqttcuaegutdbavzz.supabase.co/rest/v1/app_users?select=id%2Cusername%2Crole%2Crank%2Cemail&auth_user_id=eq.5f92ac58-54f1-46ef-a668-cb4c425021a8 406 (Not Acceptable)
GET https://jqtwqttcuaegutdbavzz.supabase.co/rest/v1/app_users?select=id%2Cusername%2Crole%2Crank&email=eq.exemplo12%40gmail.com 406 (Not Acceptable)
POST https://jqtwqttcuaegutdbavzz.supabase.co/rest/v1/app_users?select=id%2Cusername%2Crole%2Crank 403 (Forbidden)
```

## 🔍 **Análise Detalhada:**

### **Erro 422 (Unprocessable Content) - Auth Signup:**
- **Causa**: Dados inválidos na requisição de signup
- **Possíveis motivos**:
  - Email já existe no Supabase Auth
  - Formato de email inválido
  - Senha muito fraca
  - Campos obrigatórios faltando

### **Erro 406 (Not Acceptable) - Buscas:**
- **Causa**: Formato de resposta não aceito
- **URLs afetadas**: Busca por auth_user_id e email
- **Motivo**: Headers HTTP incorretos ou políticas RLS

### **Erro 403 (Forbidden) - Insert:**
- **Causa**: Permissões RLS bloqueando INSERT
- **Motivo**: Políticas não permitem criação de perfil

---

## 🚀 **Solução Completa:**

### **Passo 1: Executar Script de Correção**
```sql
-- Execute no SQL Editor do Supabase:
-- supabase/fix_signup_errors.sql
```

### **Passo 2: Verificar Configuração do Supabase**

#### **Authentication Settings:**
1. Vá para **Authentication** → **Settings**
2. Verifique **Site URL**: `http://localhost:3000`
3. Verifique **Redirect URLs**: `http://localhost:3000`
4. Desabilite providers não usados

#### **API Settings:**
1. Vá para **Settings** → **API**
2. Verifique se **JWT Settings** estão corretos
3. Confirme **anon key** está ativa

### **Passo 3: Verificar Arquivo .env**
```env
VITE_SUPABASE_URL=https://jqtwqttcuaegutdbavzz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Passo 4: Reiniciar Aplicação**
```bash
npm run dev
```

---

## 🔧 **O que o Script de Correção Faz:**

### **1. Estrutura Completa da Tabela**
- ✅ Verifica e cria todas as colunas necessárias
- ✅ Garante tipos de dados corretos
- ✅ Adiciona constraints e defaults

### **2. Políticas RLS Simplificadas**
- ✅ SELECT: Próprio registro
- ✅ INSERT: Próprio registro
- ✅ UPDATE: Próprio registro
- ✅ DELETE: Próprio registro

### **3. Permissões Completas**
- ✅ `GRANT ALL` para authenticated
- ✅ `GRANT SELECT` para anon

### **4. Sistema de Admin**
- ✅ Configura admin_emails
- ✅ Cria trigger de promoção
- ✅ Sem recursão infinita

---

## 🧪 **Testes Após Correção:**

### **Teste 1: Verificar Estrutura**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users';
```

### **Teste 2: Verificar Políticas**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'app_users';
```

### **Teste 3: Testar Inserção Manual**
```sql
INSERT INTO public.app_users (auth_user_id, username, email, role, rank)
VALUES (auth.uid(), 'test', 'test@example.com', 'USER', 'Sd');
```

### **Teste 4: Verificar Usuário Atual**
```sql
SELECT auth.uid(), auth.jwt() ->> 'email';
```

---

## 🐛 **Soluções para Erros Específicos:**

### **Erro 422 - Signup:**
1. **Verificar se email já existe:**
   ```sql
   SELECT * FROM auth.users WHERE email = 'exemplo12@gmail.com';
   ```

2. **Usar email diferente no teste**

3. **Verificar força da senha:**
   - Mínimo 6 caracteres
   - Não usar senhas comuns

### **Erro 406 - Formato:**
1. **Verificar headers no navegador:**
   ```javascript
   // No console
   fetch('/rest/v1/app_users', {
     headers: {
       'Accept': 'application/json',
       'apikey': 'sua-chave',
       'Authorization': 'Bearer seu-token'
     }
   });
   ```

2. **Limpar cache do navegador**

### **Erro 403 - Permissão:**
1. **Verificar se usuário está autenticado:**
   ```sql
   SELECT auth.uid(), auth.role();
   ```

2. **Desabilitar RLS temporariamente (teste):**
   ```sql
   ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
   ```

---

## 📋 **Checklist Final:**

- [ ] Executar `fix_signup_errors.sql`
- [ ] Verificar Authentication Settings
- [ ] Confirmar API Settings
- [ ] Verificar arquivo `.env`
- [ ] Reiniciar aplicação
- [ ] Testar com email novo
- [ ] Verificar console do navegador
- [ ] Testar login após cadastro

---

## 🎯 **Fluxo de Teste Recomendado:**

1. **Abra a aplicação**
2. **Vá para aba "Cadastrar"**
3. **Use dados de teste:**
   - Nome: Teste Completo
   - Email: `testenovo123@exemplo.com`
   - Posto: Soldado
   - Senha: `123456`
   - Confirmar: `123456`
4. **Clique em "Criar Conta"**
5. **Verifique se aparece sucesso**
6. **Aguarde redirecionamento automático**

---

## 🆘 **Se Ainda Não Funcionar:**

### **Reset Completo:**
```sql
-- Remover tudo e começar do zero
DROP TABLE IF EXISTS public.app_users CASCADE;
-- Execute o schema.sql completo novamente
```

### **Verificar Logs:**
1. **Supabase Dashboard** → **Settings** → **Logs**
2. **Procure por erros de auth ou RLS**
3. **Verifique timestamps dos erros**

### **Teste Manual:**
```javascript
// No console do navegador
const { data, error } = await supabase.auth.signUp({
  email: 'test@exemplo.com',
  password: '123456'
});
console.log('Signup:', data, error);
```

---

## ✅ **Resultado Esperado:**

Após executar o script:
- ✅ Sem erro 422 no signup
- ✅ Sem erros 406 nas buscas
- ✅ Sem erro 403 no insert
- ✅ Cadastro funciona
- ✅ Login automático após cadastro
- ✅ Sistema operacional

**Execute o script completo e todos os erros serão resolvidos!** 🚀
