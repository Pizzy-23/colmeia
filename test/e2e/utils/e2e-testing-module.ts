// test/e2e/utils/e2e-testing-module.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';

export async function createE2eTestingModule(): Promise<TestingModule> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .compile();

  return moduleFixture;
}

export async function createE2eApplication(moduleFixture: TestingModule) {
  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  await app.init();
  return app;
}

export async function cleanupTestDatabase(moduleFixture: TestingModule): Promise<void> {
  try {
    // Try to get DataSource using different possible tokens
    let dataSource;
    try {
      dataSource = moduleFixture.get('DataSource');
    } catch {
      try {
        dataSource = moduleFixture.get('TypeOrmModuleOptions');
      } catch {
        // If we can't get DataSource, try to get repositories and clear them
        try {
          const userRepo = moduleFixture.get('UserRepository');
          const roleRepo = moduleFixture.get('RoleRepository');
          const permissionRepo = moduleFixture.get('PermissionRepository');
          const customerRepo = moduleFixture.get('CustomerRepository');
          const chargeRepo = moduleFixture.get('ChargeRepository');
          
          if (userRepo && roleRepo && permissionRepo) {
            // Clear using repository methods if available
            await userRepo.clear();
            await roleRepo.clear();
            await permissionRepo.clear();
            if (customerRepo) await customerRepo.clear();
            if (chargeRepo) await chargeRepo.clear();
          }
        } catch (repoError) {
          // Silently handle repository cleanup errors
        }
        return;
      }
    }
    
    if (dataSource && dataSource.isInitialized) {
      // Usar uma abordagem mais agressiva para limpeza
      try {
        // Desabilitar constraints temporariamente
        await dataSource.query('SET session_replication_role = replica;');
        
        // Limpar todas as tabelas em ordem correta
        await dataSource.query('DELETE FROM "user_roles"');
        await dataSource.query('DELETE FROM "role_permissions"');
        await dataSource.query('DELETE FROM "charges"');
        await dataSource.query('DELETE FROM "customers"');
        await dataSource.query('DELETE FROM "users"');
        await dataSource.query('DELETE FROM "roles"');
        await dataSource.query('DELETE FROM "permissions"');
        
        // Reabilitar constraints
        await dataSource.query('SET session_replication_role = DEFAULT;');
        
        // Reset sequences para evitar conflitos de ID
        await dataSource.query('ALTER SEQUENCE "users_id_seq" RESTART WITH 1');
        await dataSource.query('ALTER SEQUENCE "customers_id_seq" RESTART WITH 1');
        await dataSource.query('ALTER SEQUENCE "charges_id_seq" RESTART WITH 1');
        await dataSource.query('ALTER SEQUENCE "roles_id_seq" RESTART WITH 1');
        await dataSource.query('ALTER SEQUENCE "permissions_id_seq" RESTART WITH 1');
      } catch (cleanupError) {
        // Se falhar, tentar uma abordagem mais simples
        try {
          await dataSource.query('TRUNCATE TABLE "user_roles" CASCADE');
          await dataSource.query('TRUNCATE TABLE "role_permissions" CASCADE');
          await dataSource.query('TRUNCATE TABLE "charges" CASCADE');
          await dataSource.query('TRUNCATE TABLE "customers" CASCADE');
          await dataSource.query('TRUNCATE TABLE "users" CASCADE');
          await dataSource.query('TRUNCATE TABLE "roles" CASCADE');
          await dataSource.query('TRUNCATE TABLE "permissions" CASCADE');
        } catch (truncateError) {
          console.warn('Database cleanup failed:', truncateError.message);
        }
      }
    }
  } catch (error) {
    // Silently handle cleanup errors
    console.warn('Database cleanup warning:', error.message);
  }
}

// Função para criar dados únicos para cada teste
export function generateUniqueTestData() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const microtime = process.hrtime.bigint().toString();
  
  // Gerar documento com exatamente 11 dígitos
  const documentSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const customerDocument = `12345678${documentSuffix}`;
  
  // Gerar telefone com 11 dígitos (formato brasileiro)
  const phoneSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const customerPhone = `1199999${phoneSuffix}`;
  
  return {
    userEmail: `user-${timestamp}-${random}@example.com`,
    customerEmail: `customer-${timestamp}-${random}@example.com`,
    customerDocument,
    customerPhone,
    chargeId: `charge-${timestamp}-${random}`,
    uniqueId: `${timestamp}-${microtime}-${random}`,
  };
}

// Função para adicionar delay entre operações
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}