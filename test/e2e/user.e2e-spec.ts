// test/e2e/user.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eTestingModule, createE2eApplication, cleanupTestDatabase } from './utils/e2e-testing-module';
import { AppModule } from '../../src/app.module';
import { LoginDto } from '../../src/application/modules/auth/dtos/login.dto';
import { CreateUserDto } from '../../src/application/modules/user/dtos/create-user.dto';
import { UserRepository } from '../../src/domain/repositories/user.repository';
import { RoleRepository } from '../../src/domain/repositories/role.repository';
import { UserEntity } from '../../src/domain/entities/user.entity';
import { EncryptionUtil } from '../../src/infrastructure/common/utils/encryption.util';
import { RoleEnum } from '../../src/domain/constants/roles.enum';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let adminAccessToken: string;
  let userAccessToken: string;
  let userRepository: UserRepository;
  let roleRepository: RoleRepository;

  beforeAll(async () => {
    moduleFixture = await createE2eTestingModule();
    app = await createE2eApplication(moduleFixture);

    // Obter repositórios para criar admin manualmente
    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    roleRepository = moduleFixture.get<RoleRepository>(RoleRepository);

    // Criar admin manualmente via repositório (apenas se não existir)
    const existingAdmin = await userRepository.findByEmail('admin@example.com');
    if (!existingAdmin) {
      const adminRole = await roleRepository.findByName(RoleEnum.ADMIN);
      if (adminRole) {
        const adminUser = new UserEntity();
        adminUser.name = 'Admin User';
        adminUser.email = 'admin@example.com';
        adminUser.passwordHash = await EncryptionUtil.hash('password');
        adminUser.roles = [adminRole];
        await userRepository.save(adminUser);
      }
    }
    
    const loginAdminDto: LoginDto = {
      email: 'admin@example.com',
      password: 'password',
    };
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(loginAdminDto)
      .expect(200);
    adminAccessToken = adminLoginResponse.body.data.accessToken;

    const newUserDto: CreateUserDto = {
      name: 'Normal User',
      email: `user-${Date.now()}@example.com`,
      password: 'password123',
    };
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(newUserDto)
      .expect(201);

    const loginUserDto: LoginDto = {
      email: newUserDto.email,
      password: 'password123',
    };
    const userLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(loginUserDto)
      .expect(200);
    userAccessToken = userLoginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await cleanupTestDatabase(moduleFixture);
      await app.close();
    }
  });

  describe('/api/v1/users (POST) - Create User', () => {
    it('deve criar um usuário com sucesso (ADMIN)', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New Test User',
        email: `newtest-${Date.now()}@example.com`,
        password: 'securepassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body.message).toBe('User created successfully.');
      expect(response.body.data.email).toBe(createUserDto.email);
      expect(response.body.data.roles).toContain('User');
    });

    it('deve falhar ao criar usuário com email duplicado (ADMIN)', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New Test User',
        email: `newtest-${Date.now()}@example.com`,
        password: 'securepassword',
      };

      // First create the user
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createUserDto)
        .expect(201);

      // Then try to create the same user again
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createUserDto)
        .expect(409);
    });

    it('deve falhar ao criar usuário se não for ADMIN (USER)', async () => {
      const anotherUserDto: CreateUserDto = {
        name: 'Another User',
        email: `another-${Date.now()}@example.com`,
        password: 'password',
      };
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(anotherUserDto)
        .expect(403);
    });

    it('deve falhar ao criar usuário se não autenticado', async () => {
      const anonymousUserDto: CreateUserDto = {
        name: 'Anonymous',
        email: `anon-${Date.now()}@example.com`,
        password: 'pass',
      };
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(anonymousUserDto)
        .expect(401);
    });
  });

  describe('/api/v1/users (GET) - Find All Users', () => {
    it('deve retornar todos os usuários (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe(
        'List of users retrieved successfully.',
      );
      expect(Array.isArray(response.body.data)).toBeTruthy();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.some((u: any) => u.email === 'admin@example.com'),
      ).toBeTruthy();
    });

    it('deve retornar todos os usuários (USER)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`) // Usuário comum pode listar
        .expect(200);

      expect(response.body.message).toBe(
        'List of users retrieved successfully.',
      );
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });
  });

  describe('/api/v1/users/:id (GET) - Find User By ID', () => {
    let testUserId: string;
    let lookupUserDto: CreateUserDto;

    beforeAll(async () => {
      // Cria um usuário para ser buscado por ID
      lookupUserDto = {
        name: 'Lookup User',
        email: `lookup-${Date.now()}@example.com`,
        password: 'password',
      };
      const creationResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(lookupUserDto)
        .expect(201);
      testUserId = creationResponse.body.data.id;
    });

    it('deve retornar o usuário pelo ID (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('User retrieved successfully.');
      expect(response.body.data.id).toBe(testUserId);
      expect(response.body.data.email).toBe(lookupUserDto.email);
    });

    it('deve retornar o usuário pelo ID (USER)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('User retrieved successfully.');
      expect(response.body.data.id).toBe(testUserId);
    });

    it('deve falhar ao buscar usuário inexistente (ADMIN)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });

  describe('/api/v1/users/public/products (GET) - Public Access', () => {
    it('deve permitir acesso a visitantes (com token)', async () => {
      const loginVisitorDto: LoginDto = {
        email: 'admin@example.com',
        password: 'password',
      };
      const visitorLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginVisitorDto)
        .expect(200);
      const visitorAccessToken = visitorLoginResponse.body.data.accessToken;

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/public/products')
        .set('Authorization', `Bearer ${visitorAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Public access to products.');
    });

    it('deve falhar se token ausente', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/public/products')
        .expect(401);
    });
  });

  describe('/api/v1/users/admin/products (POST) - Admin-only Access', () => {
    it('deve permitir acesso para ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/admin/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(201);

      expect(response.body.message).toBe('Product created.');
    });

    it('deve falhar se não for ADMIN (USER)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/admin/products')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });

    it('deve falhar se não autenticado', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/admin/products')
        .expect(401);
    });
  });

  describe('Testes de Permissões por Role', () => {
    let visitorAccessToken: string;

    beforeAll(async () => {
      // Criar usuário Visitor para testar permissões
      const visitorRole = await roleRepository.findByName(RoleEnum.VISITOR);
      if (visitorRole) {
        // Check if visitor user already exists
        const existingVisitor = await userRepository.findByEmail('visitor@example.com');
        if (!existingVisitor) {
          const visitorUser = new UserEntity();
          visitorUser.name = 'Visitor User';
          visitorUser.email = 'visitor@example.com';
          visitorUser.passwordHash = await EncryptionUtil.hash('password');
          visitorUser.roles = [visitorRole];
          await userRepository.save(visitorUser);
        }

        const loginVisitorDto: LoginDto = {
          email: 'visitor@example.com',
          password: 'password',
        };
        const visitorLoginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginVisitorDto)
          .expect(200);
        visitorAccessToken = visitorLoginResponse.body.data.accessToken;
      }
    });

    it('ADMIN pode criar usuários', async () => {
      const newUserDto: CreateUserDto = {
        name: 'Admin Created User',
        email: `admincreated-${Date.now()}@example.com`,
        password: 'password',
      };
      
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUserDto)
        .expect(201);
    });

    it('USER não pode criar usuários', async () => {
      const newUserDto: CreateUserDto = {
        name: 'User Created User',
        email: `usercreated-${Date.now()}@example.com`,
        password: 'password',
      };
      
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(newUserDto)
        .expect(403);
    });

    it('VISITOR não pode criar usuários', async () => {
      const newUserDto: CreateUserDto = {
        name: 'Visitor Created User',
        email: `visitorcreated-${Date.now()}@example.com`,
        password: 'password',
      };
      
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${visitorAccessToken}`)
        .send(newUserDto)
        .expect(403);
    });

    it('USER pode listar usuários', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);
    });

    it('VISITOR não pode listar usuários', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${visitorAccessToken}`)
        .expect(403);
    });
  });
});
