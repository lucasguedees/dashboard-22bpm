# Script para subir a aplicação para o GitHub
# Execute este script no PowerShell como Administrador

Write-Host "=== SCRIPT PARA SUBIR APLICAÇÃO PARA O GITHUB ===" -ForegroundColor Green
Write-Host "Repositório: https://github.com/lucasguedees/dashboard-22bpm" -ForegroundColor Yellow
Write-Host ""

# Verificar se o Git está instalado
try {
    git --version
    Write-Host "✓ Git encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não encontrado. Por favor, instale o Git primeiro:" -ForegroundColor Red
    Write-Host "   1. Baixe o Git em: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "   2. Instale com as opções padrão" -ForegroundColor Yellow
    Write-Host "   3. Execute este script novamente" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit
}

# Navegar para o diretório do projeto
Set-Location "C:\Users\Guedes\Downloads\dashboard-22bpm-main"
Write-Host "✓ Diretório do projeto: $(Get-Location)" -ForegroundColor Green

# Inicializar repositório Git se não existir
if (-not (Test-Path ".git")) {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Blue
    git init
    Write-Host "✓ Repositório inicializado" -ForegroundColor Green
} else {
    Write-Host "✓ Repositório Git já existe" -ForegroundColor Green
}

# Configurar remote do GitHub
Write-Host "🔗 Configurando remote do GitHub..." -ForegroundColor Blue
git remote remove origin 2>$null
git remote add origin https://github.com/lucasguedees/dashboard-22bpm.git
Write-Host "✓ Remote configurado" -ForegroundColor Green

# Adicionar arquivos ao staging
Write-Host "📋 Adicionando arquivos ao staging..." -ForegroundColor Blue
git add .
Write-Host "✓ Arquivos adicionados" -ForegroundColor Green

# Verificar status
Write-Host "📊 Status do repositório:" -ForegroundColor Blue
git status --short

# Fazer commit
Write-Host "💾 Fazendo commit das mudanças..." -ForegroundColor Blue
git commit -m "feat: implementar dashboard 22º BPM com funcionalidades completas

- Dashboard de trânsito com gráficos de evolução mensal e distribuição por categoria
- Dashboard de produtividade com estatísticas operacionais
- Sistema de lançamento de AIT e produtividade
- Exportação de gráficos em PNG com informações de filtro
- Interface responsiva e moderna com TailwindCSS
- Prevenção de fechamento inesperado de modais expandidos
- Menus suspenso de anos (2024-2030) em formulários
- Sistema de usuários com autenticação
- Gestão completa de dados com CRUD

Features:
- Gráficos interativos com Recharts
- Filtros dinâmicos por cidade, ano e mês
- Exportação de dados
- Interface dark theme
- Componentes reutilizáveis"
Write-Host "✓ Commit realizado" -ForegroundColor Green

# Fazer push para o GitHub
Write-Host "🚀 Enviando para o GitHub..." -ForegroundColor Blue
try {
    git push -u origin main
    Write-Host "✅ Aplicação enviada com sucesso para o GitHub!" -ForegroundColor Green
    Write-Host "📱 Acesse: https://github.com/lucasguedees/dashboard-22bpm" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro ao fazer push. Verifique suas credenciais do Git:" -ForegroundColor Red
    Write-Host "   1. Configure seu usuário: git config --global user.name 'Seu Nome'" -ForegroundColor Yellow
    Write-Host "   2. Configure seu email: git config --global user.email 'seu@email.com'" -ForegroundColor Yellow
    Write-Host "   3. Se necessário, gere um Personal Access Token no GitHub" -ForegroundColor Yellow
    Write-Host "   4. Execute: git push -u origin main" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== PROCESSO CONCLUÍDO ===" -ForegroundColor Green
Read-Host "Pressione Enter para sair"
