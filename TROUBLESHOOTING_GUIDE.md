# 🔧 Guia Completo - Solução de Problemas de Cadastro

## 🚨 **Problema: Dificuldades no Cadastro de Usuários**

### 📋 **Plano de Ação (Execute em Ordem):**

---

## 🔍 **PASSO 1: Diagnóstico Completo**

### Execute primeiro:
```sql
-- Copie e cole o conteúdo de:
-- supabase/complete_diagnosis.sql
```

### O que verificar:
- ✅ Tabelas existem
- ✅ Estrutura da `app_users`
- ✅ Políticas RLS atuais
- ✅ Usuário autenticado
- ✅ Permissões atuais

---

## 🔧 **PASSO 2: Correção Completa**

### Execute em seguida:
```sql
-- Copie e cole o conteúdo de:
-- supabase/fix_all_issues.sql
```

### O que este script faz:
- 🧹 **Limpa** todas as políticas antigas
- 🔨 **Reconstrói** estrutura da tabela
- 🛡️ **Cria** políticas simples e funcionais
- 👑 **Configura** sistema de admin
- ✅ **Verifica** tudo funcionando

---

## 🎯 **PASSO 3: Verificação da Aplicação**

### 3.1 Verificar arquivo `.env`
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3.2 Verificar console do navegador
- Abra **F12** → **Console**
- Procure por erros vermelhos
- Erros comuns:
  - `Supabase não configurado`
  - `permission denied`
  - `infinite recursion`

### 3.3 Testar fluxo completo
1. **Abra a aplicação**
2. **Vá para aba "Cadastrar"**
3. **Preencha formulário**:
   - Nome: Teste Usuario
   - Email: teste@exemplo.com
   - Posto: Soldado
   - Senha: 123456
   - Confirmar: 123456
4. **Clique em "Criar Conta"**

---

## 🐛 **Problemas Comuns e Soluções:**

### ❌ **"Supabase não configurado"**
**Causa:** Variáveis de ambiente não definidas
**Solução:** Configure o arquivo `.env`

### ❌ **"permission denied for table app_users"**
**Causa:** Políticas RLS incorretas
**Solução:** Execute `fix_all_issues.sql`

### ❌ **"infinite recursion detected"**
**Causa:** Políticas consultando a própria tabela
**Solução:** Execute `fix_all_issues.sql`

### ❌ **"Falha ao criar conta"**
**Causa:** Schema SQL não executado
**Solução:** Execute `supabase/schema.sql` completo

### ❌ **"Email já cadastrado"**
**Causa:** Usuário já existe no Supabase Auth
**Solução:** Use outro email ou delete o usuário

---

## 🔍 **Diagnóstico Avançado:**

### Verificar no Supabase Dashboard:
1. **Authentication** → **Users** → Verifique se usuário aparece
2. **Table Editor** → **app_users** → Verifique se perfil foi criado
3. **Settings** → **Logs** → Procure erros

### Comandos SQL úteis:
```sql
-- Verificar usuários no Auth
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Verificar perfis na app_users
SELECT * FROM public.app_users ORDER BY created_at DESC LIMIT 5;

-- Verificar políticas atuais
SELECT * FROM pg_policies WHERE tablename = 'app_users';
```

---

## ✅ **Checklist Final:**

- [ ] Executar `complete_diagnosis.sql`
- [ ] Executar `fix_all_issues.sql`
- [ ] Verificar arquivo `.env`
- [ ] Testar cadastro na aplicação
- [ ] Verificar usuário no Supabase Auth
- [ ] Verificar perfil na app_users
- [ ] Testar login com novo usuário

---

## 🆘 **Se Ainda Não Funcionar:**

### 1. Reset Completo:
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- Testar cadastro manual
INSERT INTO public.app_users (auth_user_id, username, role, rank, email)
VALUES ('test-id', 'test', 'USER', 'Sd', 'test@example.com');

-- Reabilitar RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
```

### 2. Verificar Conexão:
```javascript
// No console do navegador
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase client:', supabase);
```

### 3. Contato:
- Abra issue no GitHub
- Verifique logs do Supabase
- Confirme configuração do projeto

---

## 🎉 **Sucesso Esperado:**

Após executar os scripts:
- ✅ Cadastro funciona
- ✅ Login automático após cadastro
- ✅ Admins promovidos automaticamente
- ✅ Sistema operacional

**Execute os scripts em ordem e o cadastro funcionará!** 🚀
