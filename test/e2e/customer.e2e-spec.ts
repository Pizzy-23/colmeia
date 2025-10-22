// test/e2e/customer.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eTestingModule, createE2eApplication, cleanupTestDatabase, generateUniqueTestData, delay } from './utils/e2e-testing-module';
import { AppModule } from '../../src/app.module';
import { LoginDto } from '../../src/application/modules/auth/dtos/login.dto';
import { CreateUserDto } from '../../src/application/modules/user/dtos/create-user.dto';
import { CreateCustomerDto } from '../../src/application/modules/customer/dtos/create-customer.dto';
import { UserRepository } from '../../src/domain/repositories/user.repository';
import { RoleRepository } from '../../src/domain/repositories/role.repository';
import { CustomerRepository } from '../../src/domain/repositories/customer.repository';
import { UserEntity } from '../../src/domain/entities/user.entity';
import { CustomerEntity } from '../../src/domain/entities/customer.entity';
import { EncryptionUtil } from '../../src/infrastructure/common/utils/encryption.util';
import { RoleEnum } from '../../src/domain/constants/roles.enum';

describe('CustomerController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let adminAccessToken: string;
  let userAccessToken: string;
  let customerId: string;
  let userRepository: UserRepository;
  let roleRepository: RoleRepository;

  beforeAll(async () => {
    moduleFixture = await createE2eTestingModule();
    app = await createE2eApplication(moduleFixture);

    // Clean database before tests
    await cleanupTestDatabase(moduleFixture);

    // Obter repositórios para criar admin e user
    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    roleRepository = moduleFixture.get<RoleRepository>(RoleRepository);

    // Criar admin manualmente via repositório (apenas se não existir)
    let adminUser = await userRepository.findByEmail('admin@example.com');
    if (!adminUser) {
      const adminRole = await roleRepository.findByName(RoleEnum.ADMIN);
      if (adminRole) {
        adminUser = new UserEntity();
        adminUser.name = 'Admin User';
        adminUser.email = 'admin@example.com';
        adminUser.passwordHash = await EncryptionUtil.hash('password');
        adminUser.roles = [adminRole];
        await userRepository.save(adminUser);
      }
    }

    // Criar usuário comum
    const userRole = await roleRepository.findByName(RoleEnum.USER);
    if (userRole) {
      const userEmail = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      const normalUser = new UserEntity();
      normalUser.name = 'Normal User';
      normalUser.email = userEmail;
      normalUser.passwordHash = await EncryptionUtil.hash('password');
      normalUser.roles = [userRole];
      await userRepository.save(normalUser);
      
      // Login user
      const userLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: userEmail, password: 'password' })
        .expect(200);
      userAccessToken = userLoginResponse.body.data.accessToken;
    }

    // Login admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);
    adminAccessToken = adminLoginResponse.body.data.accessToken;

    // Criar customer para os testes (apenas se não existir)
    const customerRepository = moduleFixture.get<CustomerRepository>(CustomerRepository);
    let customer = await customerRepository.findByEmail('customer@example.com');
    if (!customer) {
      customer = new CustomerEntity();
      customer.name = 'Test Customer';
      customer.email = 'customer@example.com';
      customer.document = '12345678901';
      customer.phone = '+5511999999999';
      customer = await customerRepository.save(customer);
    }
    customerId = customer.id;
  });

  beforeEach(async () => {
    // Renovar tokens antes de cada teste para evitar expiração
    try {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password' });
      
      if (adminLoginResponse.status === 200) {
        adminAccessToken = adminLoginResponse.body.data.accessToken;
      }
    } catch (error) {
      // Ignorar erros de renovação de token
    }
  });


  afterAll(async () => {
    if (app) {
      await cleanupTestDatabase(moduleFixture);
      await app.close();
    }
  });

  describe('/api/v1/customers (POST) - Create Customer', () => {
    it('deve criar um cliente com sucesso (ADMIN)', async () => {
      const testData = generateUniqueTestData();
      await delay(10); // Pequeno delay para garantir unicidade
      
      const createCustomerDto: CreateCustomerDto = {
        name: 'New Test Customer',
        email: testData.customerEmail,
        document: testData.customerDocument,
        phone: testData.customerPhone,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createCustomerDto)
        .expect(201);
      expect(response.body.message).toBe('Customer created successfully.');
      expect(response.body.data.name).toBe(createCustomerDto.name);
      expect(response.body.data.email).toBe(createCustomerDto.email);
      expect(response.body.data.document).toBe(createCustomerDto.document);
      expect(response.body.data.phone).toBe(createCustomerDto.phone);

      customerId = response.body.data.id;
    });

    it('deve falhar ao criar cliente com email duplicado (ADMIN)', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Another Customer',
        email: 'customer@example.com', // Mesmo email do customer criado no beforeAll
        document: '98765432109',
        phone: '11888888888',
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createCustomerDto)
        .expect(409);
    });

    it('deve falhar ao criar cliente com documento duplicado (ADMIN)', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Another Customer',
        email: 'another@example.com',
        document: '12345678901', // Mesmo documento do customer criado no beforeAll
        phone: '11888888888',
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createCustomerDto)
        .expect(409);
    });

    it('deve falhar ao criar cliente com dados inválidos (ADMIN)', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: '', // Nome vazio
        email: 'invalid-email', // Email inválido
        document: '', // Documento vazio
        phone: '', // Telefone vazio
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createCustomerDto)
        .expect(400);
    });

    it('deve falhar ao criar cliente se não for ADMIN (USER)', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Test Customer',
        email: `test-${Date.now()}@example.com`,
        document: `1111111111${Math.floor(Math.random() * 10)}`,
        phone: '+5511111111111',
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createCustomerDto)
        .expect(403);
    });

    it('deve falhar ao criar cliente se não autenticado', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'Test Customer',
        email: `test-${Date.now()}@example.com`,
        document: `1111111111${Math.floor(Math.random() * 10)}`,
        phone: '+5511111111111',
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .send(createCustomerDto)
        .expect(401);
    });
  });

  describe('/api/v1/customers (GET) - Find All Customers', () => {
    it('deve retornar todos os clientes (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Customers retrieved successfully.');
      expect(Array.isArray(response.body.data)).toBeTruthy();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((c: any) => c.email === 'customer@example.com')).toBeTruthy();
    });

    it('deve retornar todos os clientes (USER)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Customers retrieved successfully.');
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });

    it('deve falhar se não autenticado', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/customers')
        .expect(401);
    });
  });

  describe('/api/v1/customers/:id (GET) - Find Customer By ID', () => {
    it('deve retornar o cliente pelo ID (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Customer retrieved successfully.');
      expect(response.body.data.id).toBe(customerId);
      expect(response.body.data.email).toBeDefined();
    });

    it('deve retornar o cliente pelo ID (USER)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Customer retrieved successfully.');
      expect(response.body.data.id).toBe(customerId);
    });

    it('deve falhar ao buscar cliente inexistente (ADMIN)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/customers/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('deve falhar se não autenticado', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .expect(401);
    });
  });

  describe('/api/v1/customers/:id (PUT) - Update Customer', () => {
    it('deve atualizar cliente com sucesso (ADMIN)', async () => {
      const updateCustomerDto = {
        name: 'Updated Customer Name',
        phone: '+5511999999999',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateCustomerDto)
        .expect(200);

      expect(response.body.message).toBe('Customer updated successfully.');
      expect(response.body.data.name).toBe(updateCustomerDto.name);
      expect(response.body.data.phone).toBe(updateCustomerDto.phone);
    });

    it('deve falhar ao atualizar cliente inexistente (ADMIN)', async () => {
      const updateCustomerDto = {
        name: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put('/api/v1/customers/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateCustomerDto)
        .expect(404);
    });

    it('deve falhar ao atualizar cliente se não for ADMIN (USER)', async () => {
      const updateCustomerDto = {
        name: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateCustomerDto)
        .expect(403);
    });

    it('deve falhar se não autenticado', async () => {
      const updateCustomerDto = {
        name: 'Updated Name',
      };

      await request(app.getHttpServer())
        .put(`/api/v1/customers/${customerId}`)
        .send(updateCustomerDto)
        .expect(401);
    });
  });

  describe('/api/v1/customers/:id (DELETE) - Delete Customer', () => {
    let customerToDeleteId: string;

    beforeAll(async () => {
      // Criar um cliente para deletar
      const testData = generateUniqueTestData();
      await delay(10);
      
      const createCustomerDto: CreateCustomerDto = {
        name: 'Customer To Delete',
        email: testData.customerEmail,
        document: testData.customerDocument,
        phone: testData.customerPhone,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createCustomerDto)
        .expect(201);

      customerToDeleteId = response.body.data.id;
    });

    it('deve deletar cliente com sucesso (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/customers/${customerToDeleteId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Customer deleted successfully.');
    });

    it('deve falhar ao deletar cliente inexistente (ADMIN)', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/customers/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('deve falhar ao deletar cliente se não for ADMIN (USER)', async () => {
      // Criar outro cliente para testar
      const testData = generateUniqueTestData();
      await delay(10);
      
      const createCustomerDto: CreateCustomerDto = {
        name: 'Another Customer To Delete',
        email: testData.customerEmail,
        document: testData.customerDocument,
        phone: testData.customerPhone,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createCustomerDto)
        .expect(201);

      const anotherCustomerId = response.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/customers/${anotherCustomerId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });

    it('deve falhar se não autenticado', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/customers/${customerId}`)
        .expect(401);
    });
  });
});
