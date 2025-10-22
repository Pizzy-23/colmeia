#!/bin/bash

# 🚀 Colmeia Setup Script
# Script para configurar o ambiente de desenvolvimento

set -e

echo "🚀 Iniciando setup do Colmeia..."

# ===========================================
# 📋 Verificar Pré-requisitos
# ===========================================
echo "📋 Verificando pré-requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Verificar Yarn
if ! command -v yarn &> /dev/null; then
    echo "📦 Instalando Yarn..."
    npm install -g yarn
fi

echo "✅ Yarn $(yarn -v) encontrado"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

echo "✅ Docker $(docker --version) encontrado"

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker Compose $(docker-compose --version) encontrado"

# ===========================================
# 📦 Instalar Dependências
# ===========================================
echo "📦 Instalando dependências..."
yarn install

# ===========================================
# 🐳 Configurar Docker
# ===========================================
echo "🐳 Configurando Docker..."

# Parar containers existentes
docker-compose down 2>/dev/null || true

# Remover volumes antigos (opcional)
read -p "🗑️  Remover dados antigos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down -v
    docker system prune -f
fi

# ===========================================
# 🚀 Iniciar Serviços
# ===========================================
echo "🚀 Iniciando serviços..."

# Iniciar banco de dados
echo "🗄️  Iniciando PostgreSQL..."
docker-compose up -d postgres

# Aguardar banco estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 10

# Verificar se banco está rodando
until docker-compose exec postgres pg_isready -U postgres; do
    echo "⏳ Aguardando PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL está rodando!"

# ===========================================
# 🧪 Executar Testes
# ===========================================
echo "🧪 Executando testes..."

# Configurar variáveis de ambiente para testes
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=colmeia_test
export JWT_SECRET=test-secret-key

# Executar testes
yarn test:e2e

echo "✅ Testes executados com sucesso!"

# ===========================================
# 🎉 Finalização
# ===========================================
echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📚 Próximos passos:"
echo "  1. Acesse: http://localhost:3000/api/docs"
echo "  2. Execute: yarn start:dev"
echo "  3. Teste a API no Swagger"
echo ""
echo "🐳 Para usar Docker:"
echo "  docker-compose up -d"
echo ""
echo "📊 Para monitoramento:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001"
echo ""
echo "🚀 Colmeia está pronto para uso!"
