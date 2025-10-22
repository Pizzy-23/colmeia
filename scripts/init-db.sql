-- 🗄️ Colmeia Database Initialization
-- Script para inicializar o banco de dados

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'UTC';

-- Criar índices para performance
-- (Os índices serão criados automaticamente pelo TypeORM)
