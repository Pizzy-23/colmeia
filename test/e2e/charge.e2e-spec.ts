// test/e2e/charge.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eTestingModule, createE2eApplication, cleanupTestDatabase, generateUniqueTestData, delay } from './utils/e2e-testing-module';
import { AppModule } from '../../src/app.module';
import { LoginDto } from '../../src/application/modules/auth/dtos/login.dto';
import { CreateUserDto } from '../../src/application/modules/user/dtos/create-user.dto';
import { CreateCustomerDto } from '../../src/application/modules/customer/dtos/create-customer.dto';
import { CreateChargeDto } from '../../src/application/modules/charge/dtos/create-charge.dto';
import { UpdateChargeStatusDto } from '../../src/application/modules/charge/dtos/update-charge-status.dto';
import { UserRepository } from '../../src/domain/repositories/user.repository';
import { RoleRepository } from '../../src/domain/repositories/role.repository';
import { CustomerRepository } from '../../src/domain/repositories/customer.repository';
import { UserEntity } from '../../src/domain/entities/user.entity';
import { CustomerEntity } from '../../src/domain/entities/customer.entity';
import { EncryptionUtil } from '../../src/infrastructure/common/utils/encryption.util';
import { RoleEnum } from '../../src/domain/constants/roles.enum';
import { PaymentMethodEnum, ChargeStatusEnum } from '../../src/domain/entities/charge.entity';

describe('ChargeController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let adminAccessToken: string;
  let userAccessToken: string;
  let customerId: string;
  let chargeId: string;
  let userRepository: UserRepository;
  let roleRepository: RoleRepository;
  let customerRepository: CustomerRepository;

  beforeAll(async () => {
    moduleFixture = await createE2eTestingModule();
    app = await createE2eApplication(moduleFixture);

    // Clean database before tests
    await cleanupTestDatabase(moduleFixture);

    // Obter repositórios para criar admin e customer
    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    roleRepository = moduleFixture.get<RoleRepository>(RoleRepository);
    customerRepository = moduleFixture.get<CustomerRepository>(CustomerRepository);

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
    let customer = await customerRepository.findByEmail('customer@example.com');
    if (!customer) {
      customer = new CustomerEntity();
      customer.name = 'Test Customer';
      customer.email = 'customer@example.com';
      customer.document = '12345678901';
      customer.phone = '11999999999';
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

  describe('/api/v1/charges (POST) - Create Charge', () => {
    it('deve criar uma cobrança PIX com sucesso (ADMIN)', async () => {
      await delay(10); // Pequeno delay para garantir unicidade
      
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 100.50,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.PIX,
        description: 'Test PIX charge',
        metadata: {},
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createChargeDto);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Charge created successfully.');
      expect(response.body.data.customerId).toBe(customerId);
      expect(response.body.data.amount).toBe(100.50);
      expect(response.body.data.paymentMethod).toBe(PaymentMethodEnum.PIX);
      expect(response.body.data.status).toBe(ChargeStatusEnum.PENDING);

      chargeId = response.body.data.id;
    });

    it('deve criar uma cobrança de cartão de crédito com dados do cartão (ADMIN)', async () => {
      await delay(10);
      
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 250.75,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.CREDIT_CARD,
        description: 'Test Credit Card charge',
        metadata: {
          cardData: {
            number: '4111111111111111',
            cvv: '123',
            expiryMonth: '12',
            expiryYear: '2025',
            holderName: 'Test Holder',
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createChargeDto)
        .expect(201);

      expect(response.body.message).toBe('Charge created successfully.');
      expect(response.body.data.paymentMethod).toBe(PaymentMethodEnum.CREDIT_CARD);
      expect(response.body.data.metadata.cardData).toBeDefined();
    });

    it('deve criar uma cobrança de boleto com data de vencimento (ADMIN)', async () => {
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 500.00,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.BANK_SLIP,
        description: 'Test Bank Slip charge',
        metadata: {},
        expiresAt: '2024-12-31T23:59:59.999Z',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createChargeDto)
        .expect(201);

      expect(response.body.message).toBe('Charge created successfully.');
      expect(response.body.data.paymentMethod).toBe(PaymentMethodEnum.BANK_SLIP);
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('deve falhar ao criar cobrança com cliente inexistente (ADMIN)', async () => {
      const createChargeDto: CreateChargeDto = {
        customerId: 'non-existent-customer-id',
        amount: 100.50,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.PIX,
        description: 'Test charge',
        metadata: {},
      };

      await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createChargeDto)
        .expect(404);
    });

    it('deve falhar ao criar cobrança de cartão sem dados do cartão (ADMIN)', async () => {
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 100.50,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.CREDIT_CARD,
        description: 'Test charge',
        metadata: {},
      };

      await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createChargeDto)
        .expect(400);
    });

    it('deve falhar ao criar cobrança de boleto sem data de vencimento (ADMIN)', async () => {
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 100.50,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.BANK_SLIP,
        description: 'Test charge',
        metadata: {},
      };

      await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createChargeDto)
        .expect(400);
    });

    it('deve falhar ao criar cobrança se não for ADMIN (USER)', async () => {
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 100.50,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.PIX,
        description: 'Test charge',
        metadata: {},
      };

      await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createChargeDto)
        .expect(403);
    });

    it('deve falhar ao criar cobrança se não autenticado', async () => {
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 100.50,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.PIX,
        description: 'Test charge',
        metadata: {},
      };

      await request(app.getHttpServer())
        .post('/api/v1/charges')
        .send(createChargeDto)
        .expect(401);
    });
  });

  describe('/api/v1/charges (GET) - Find All Charges', () => {
    it('deve retornar todas as cobranças (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Charges retrieved successfully.');
      expect(Array.isArray(response.body.data)).toBeTruthy();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve retornar todas as cobranças (USER)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/charges')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Charges retrieved successfully.');
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });

    it('deve falhar se não autenticado', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/charges')
        .expect(401);
    });
  });

  describe('/api/v1/charges/:id (GET) - Find Charge By ID', () => {
    it('deve retornar a cobrança pelo ID (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/charges/${chargeId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Charge retrieved successfully.');
      expect(response.body.data.id).toBe(chargeId);
    });

    it('deve retornar a cobrança pelo ID (USER)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/charges/${chargeId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Charge retrieved successfully.');
      expect(response.body.data.id).toBe(chargeId);
    });

    it('deve falhar ao buscar cobrança inexistente (ADMIN)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/charges/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('deve falhar se não autenticado', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/charges/${chargeId}`)
        .expect(401);
    });
  });

  describe('/api/v1/charges/customer/:customerId (GET) - Find Charges By Customer', () => {
    it('deve retornar cobranças do cliente (ADMIN)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/charges/customer/${customerId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Customer charges retrieved successfully.');
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });

    it('deve retornar cobranças do cliente (USER)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/charges/customer/${customerId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Customer charges retrieved successfully.');
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });

    it('deve falhar ao buscar cobranças de cliente inexistente (ADMIN)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/charges/customer/non-existent-customer-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('deve falhar se não autenticado', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/charges/customer/${customerId}`)
        .expect(401);
    });
  });

  describe('/api/v1/charges/:id/status (PATCH) - Update Charge Status', () => {
    it('deve atualizar status para PAID (ADMIN)', async () => {
      const updateStatusDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PAID,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/charges/${chargeId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateStatusDto)
        .expect(200);

      expect(response.body.message).toBe('Charge status updated successfully.');
      expect(response.body.data.status).toBe(ChargeStatusEnum.PAID);
    });

    it('deve atualizar status para FAILED com motivo (ADMIN)', async () => {
      // Criar nova cobrança para testar falha
      const createChargeDto: CreateChargeDto = {
        customerId,
        amount: 200.00,
        currency: 'BRL',
        paymentMethod: PaymentMethodEnum.PIX,
        description: 'Test charge for failure',
        metadata: {},
      };

      const chargeResponse = await request(app.getHttpServer())
        .post('/api/v1/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createChargeDto)
        .expect(201);

      const newChargeId = chargeResponse.body.data.id;

      const updateStatusDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.FAILED,
        failureReason: 'Insufficient funds',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/charges/${newChargeId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateStatusDto)
        .expect(200);

      expect(response.body.message).toBe('Charge status updated successfully.');
      expect(response.body.data.status).toBe(ChargeStatusEnum.FAILED);
      expect(response.body.data.failureReason).toBe('Insufficient funds');
    });

    it('deve falhar ao atualizar status de cobrança inexistente (ADMIN)', async () => {
      const updateStatusDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PAID,
      };

      await request(app.getHttpServer())
        .put('/api/v1/charges/non-existent-id/status')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateStatusDto)
        .expect(404);
    });

    it('deve falhar ao tentar alterar cobrança já paga (ADMIN)', async () => {
      const updateStatusDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.FAILED,
      };

      await request(app.getHttpServer())
        .put(`/api/v1/charges/${chargeId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateStatusDto)
        .expect(400);
    });

    it('deve falhar se não for ADMIN (USER)', async () => {
      const updateStatusDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PAID,
      };

      await request(app.getHttpServer())
        .put(`/api/v1/charges/${chargeId}/status`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateStatusDto)
        .expect(403);
    });

    it('deve falhar se não autenticado', async () => {
      const updateStatusDto: UpdateChargeStatusDto = {
        status: ChargeStatusEnum.PAID,
      };

      await request(app.getHttpServer())
        .put(`/api/v1/charges/${chargeId}/status`)
        .send(updateStatusDto)
        .expect(401);
    });
  });
});
