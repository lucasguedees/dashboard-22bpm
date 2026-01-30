# 🚀 Guia de Configuração do Supabase - Dashboard 22º BPM

## 📋 Pré-requisitos
- Conta no [Supabase](https://supabase.com)
- Projeto React já configurado

---

## 🔧 Passo 1: Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub, Google ou email
4. Clique em "New Project"
5. **Organização**: Selecione ou crie uma organização
6. **Nome do projeto**: `dashboard-22bpm`
7. **Senha do banco**: Crie uma senha forte e salve
8. **Região**: Escolha a mais próxima (ex: South America)
9. Clique em "Create new project"

---

## 🔑 Passo 2: Obter Credenciais

Após criar o projeto:

1. Vá para **Settings** > **API**
2. Copie os seguintes dados:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 📝 Passo 3: Configurar Variáveis de Ambiente

1. Renomeie `.env.example` para `.env`
2. Preencha com suas credenciais:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🗄️ Passo 4: Executar Schema SQL

1. No painel Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie e cole todo o conteúdo do arquivo `supabase/schema.sql`
4. Clique em "Run" para executar

**O que será criado:**
- ✅ Tabela `app_users` (usuários do sistema)
- ✅ Tabela `traffic_infractions` (dados de trânsito)
- ✅ Tabela `productivity_records` (dados de produtividade)
- ✅ Views para consultas otimizadas
- ✅ Políticas de segurança (RLS)
- ✅ Sistema de promoção automática de admin

---

## 👤 Passo 5: Configurar Admin Principal

O schema já inclui seu email como admin:
```sql
insert into public.admin_emails(email)
values ('lucasm.guedes@yahoo.com.br')
```

**Para adicionar outros admins:**
```sql
insert into public.admin_emails(email)
values ('outro@email.com');
```

---

## 🔒 Passo 6: Configurar Autenticação

1. Vá para **Authentication** > **Settings**
2. Em **Site URL**, coloque: `http://localhost:3000`
3. Em **Redirect URLs**, adicione:
   - `http://localhost:3000`
   - `https://seu-dominio.com` (para produção)

4. Desabilite providers não utilizados:
   - Mantenha **Email** ativado
   - Desative **Phone**, **Social** se não usar

---

## 🚀 Passo 7: Testar Configuração

1. Inicie a aplicação:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:3000`

3. **Primeiro acesso:**
   - Use seu email admin: `lucasm.guedes@yahoo.com.br`
   - Crie uma senha
   - Será promovido a ADMIN automaticamente

4. **Acessos subsequentes:**
   - Use email e senha
   - Novos usuários criados automaticamente como USER

---

## 📊 Estrutura do Sistema

### **Tipos de Usuário:**
- **ADMIN**: Acesso total a todas as funcionalidades
- **COMANDO**: Visualização e edição limitada
- **USER**: Apenas visualização

### **Fluxo de Autenticação:**
1. Usuário faz login com email/senha
2. Sistema cria/verifica perfil em `app_users`
3. Se email está em `admin_emails` → vira ADMIN
4. Senão → USER comum

---

## 🔧 Troubleshooting

### **Erro "Supabase não configurado"**
- Verifique se o arquivo `.env` existe
- Confirme as variáveis estão corretas
- Reinicie o servidor: `npm run dev`

### **Erro de permissão**
- Execute o schema SQL novamente
- Verifique se RLS está ativado
- Confirme políticas de segurança

### **Login não funciona**
- Verifique console do navegador
- Confirme URL e keys do Supabase
- Teste com email diferente

---

## 🌱 Deploy em Produção

1. **Vercel/Netlify**: Configure as variáveis de ambiente no painel
2. **URL de produção**: Adicione em Redirect URLs do Supabase
3. **Schema**: O mesmo SQL funciona para produção

---

## 📞 Suporte

- **Documentação Supabase**: https://supabase.com/docs
- **Issues do projeto**: https://github.com/lucasguedees/dashboard-22bpm/issues

---

## ✅ Checklist Final

- [ ] Projeto Supabase criado
- [ ] Credenciais obtidas
- [ ] Arquivo `.env` configurado
- [ ] Schema SQL executado
- [ ] Autenticação configurada
- [ ] Primeiro login testado
- [ ] Permissões verificadas

**Sistema pronto para uso! 🎉**
