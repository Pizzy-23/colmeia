# 🚀 Colmeia API - Dockerfile
# Multi-stage build para otimização

# ===========================================
# Stage 1: Build
# ===========================================
FROM node:18-alpine AS builder

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json yarn.lock ./

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN yarn build

# ===========================================
# Stage 2: Production
# ===========================================
FROM node:18-alpine AS production

# Instalar dependências do sistema para PostgreSQL
RUN apk add --no-cache postgresql-client

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json yarn.lock ./

# Instalar apenas dependências de produção
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copiar build da aplicação
COPY --from=builder /app/dist ./dist

# Copiar arquivos necessários
COPY --from=builder /app/src ./src
COPY --from=builder /app/test ./test

# Alterar propriedade dos arquivos
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"]
