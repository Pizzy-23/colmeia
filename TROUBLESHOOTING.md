# 🔧 Troubleshooting - Colmeia

## 🚨 Problemas Comuns e Soluções

### 📋 Índice
- [🐳 Problemas com Docker](#-problemas-com-docker)
- [🗄️ Problemas com Banco de Dados](#️-problemas-com-banco-de-dados)
- [📦 Problemas com Dependências](#-problemas-com-dependências)
- [🧪 Problemas com Testes](#-problemas-com-testes)
- [🚀 Problemas com Aplicação](#-problemas-com-aplicação)
- [🔧 Soluções Alternativas](#-soluções-alternativas)

---

## 🐳 Problemas com Docker

### ❌ **Erro: "Cannot connect to the Docker daemon"**

**Solução:**
```bash
# Iniciar Docker Desktop
# Ou no Linux:
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker (Linux)
sudo usermod -aG docker $USER
# Faça logout e login novamente
```

### ❌ **Erro: "Port already in use"**

**Solução:**
```bash
# Verificar portas em uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# Parar processos que estão usando as portas
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5432 | xargs kill -9

# Ou usar portas diferentes no docker-compose.yml
```

### ❌ **Erro: "Permission denied" no Docker**

**Solução:**
```bash
# No Linux/Mac, dar permissões corretas
sudo chown -R $USER:$USER .
chmod +x scripts/setup.sh

# Ou executar com sudo (não recomendado)
sudo docker-compose up
```

---

## 🗄️ Problemas com Banco de Dados

### ❌ **Erro: "Connection refused" para PostgreSQL**

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Verificar logs
docker-compose logs postgres

# Aguardar banco estar pronto
docker-compose exec postgres pg_isready -U postgres
```

### ❌ **Erro: "Database does not exist"**

**Solução:**
```bash
# Criar banco manualmente
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE colmeia_test;"

# Ou recriar containers
docker-compose down -v
docker-compose up -d
```

### ❌ **Erro: "Authentication failed"**

**Solução:**
```bash
# Verificar variáveis de ambiente
echo $DB_PASSWORD
echo $DB_USERNAME

# Resetar senha do PostgreSQL
docker-compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
```

---

## 📦 Problemas com Dependências

### ❌ **Erro: "Module not found"**

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules
rm -rf yarn.lock
yarn install

# Ou usar npm
rm -rf node_modules package-lock.json
npm install
```

### ❌ **Erro: "Python not found" (Node-gyp)**

**Solução:**
```bash
# Ubuntu/Debian
sudo apt-get install python3 build-essential

# macOS
xcode-select --install

# Windows
# Instalar Visual Studio Build Tools
```

### ❌ **Erro: "Permission denied" no yarn**

**Solução:**
```bash
# Configurar yarn global
yarn config set prefix ~/.yarn-global
echo 'export PATH="$HOME/.yarn-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Ou usar npm
npm install -g yarn
```

---

## 🧪 Problemas com Testes

### ❌ **Erro: "Database connection failed" nos testes**

**Solução:**
```bash
# Verificar se banco está rodando
docker-compose ps

# Aguardar banco estar pronto
sleep 10

# Executar testes com timeout maior
yarn test:e2e --testTimeout=60000
```

### ❌ **Erro: "Port 3000 already in use"**

**Solução:**
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou usar porta diferente
PORT=3001 yarn test:e2e
```

### ❌ **Erro: "Timeout" nos testes**

**Solução:**
```bash
# Aumentar timeout
yarn test:e2e --testTimeout=120000

# Executar testes sequencialmente
yarn test:e2e --maxWorkers=1
```

---

## 🚀 Problemas com Aplicação

### ❌ **Erro: "Cannot find module"**

**Solução:**
```bash
# Verificar se build foi feito
yarn build

# Verificar se node_modules existe
ls -la node_modules

# Reinstalar dependências
yarn install
```

### ❌ **Erro: "JWT_SECRET not defined"**

**Solução:**
```bash
# Criar arquivo .env
cp .env.example .env

# Editar .env com suas configurações
nano .env

# Verificar variáveis
echo $JWT_SECRET
```

### ❌ **Erro: "CORS" no frontend**

**Solução:**
```bash
# Adicionar CORS no main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});
```

---

## 🔧 Soluções Alternativas

### 🐳 **Usar Docker para Tudo**

Se nada funcionar, use Docker:

```bash
# 1. Clonar repositório
git clone <repo-url>
cd colmeia

# 2. Ou usar Docker Compose
docker-compose up -d

# 3. Acessar aplicação
# http://localhost:3000/api/docs
```

### 🖥️ **Usar WSL2 (Windows)**

```bash
# 1. Instalar WSL2
wsl --install

# 2. Instalar Docker Desktop para WSL2
# 3. Executar comandos no WSL2
wsl
cd /mnt/c/Users/.../colmeia
./scripts/setup.sh
```

### 🍎 **macOS com Homebrew**

```bash
# 1. Instalar dependências
brew install node postgresql docker

# 2. Iniciar PostgreSQL
brew services start postgresql

# 3. Criar banco
createdb colmeia_test

# 4. Executar aplicação
yarn install
yarn start:dev
```

### 🐧 **Linux Ubuntu/Debian**

```bash
# 1. Instalar dependências
sudo apt update
sudo apt install nodejs npm postgresql docker.io docker-compose

# 2. Configurar PostgreSQL
sudo -u postgres createdb colmeia_test
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# 3. Executar aplicação
yarn install
yarn start:dev
```

---

## 🆘 **Se Nada Funcionar**

### 📞 **Contato de Suporte**

1. **Verificar logs:**
   ```bash
   docker-compose logs api
   docker-compose logs postgres
   ```

2. **Resetar tudo:**
   ```bash
   docker-compose down -v
   docker system prune -a
   rm -rf node_modules
   yarn install
   docker-compose up -d
   ```

3. **Usar modo de desenvolvimento:**
   ```bash
   # Sem Docker, apenas com banco local
   yarn install
   yarn start:dev
   ```

### 🔍 **Debug Avançado**

```bash
# Verificar recursos do sistema
docker stats

# Verificar logs detalhados
docker-compose logs -f

# Entrar no container para debug
docker-compose exec api sh
docker-compose exec postgres psql -U postgres
```

---

## ✅ **Checklist de Verificação**

- [ ] Node.js 18+ instalado
- [ ] Yarn instalado
- [ ] Docker instalado e rodando
- [ ] Docker Compose instalado
- [ ] Portas 3000, 5432, 6379 livres
- [ ] Arquivo .env configurado
- [ ] Dependências instaladas (yarn install)
- [ ] Banco de dados rodando
- [ ] Testes passando

---

**💡 Dica:** Se ainda tiver problemas, use o Docker Compose - ele resolve 99% dos problemas de ambiente!
