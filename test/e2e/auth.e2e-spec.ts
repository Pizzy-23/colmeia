// test/e2e/auth.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eTestingModule, createE2eApplication, cleanupTestDatabase } from './utils/e2e-testing-module';
import { AppModule } from '../../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let adminAccessToken: string; 
  let userRepository: any;
  let roleRepository: any;

  beforeAll(async () => {
    moduleFixture = await createE2eTestingModule();
    app = await createE2eApplication(moduleFixture);

    // Clean database before tests
    await cleanupTestDatabase(moduleFixture);

    // Try to login with admin credentials
    try {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password' })
        .expect(200);

      adminAccessToken = loginResponse.body.data.accessToken;
    } catch (error) {
      // If admin doesn't exist, create one
      const createUserResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'Test Admin',
          email: 'admin@example.com',
          password: 'password',
          roles: ['Admin']
        });
      
      if (createUserResponse.status === 201) {
        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'admin@example.com', password: 'password' })
          .expect(200);

        adminAccessToken = loginResponse.body.data.accessToken;
      }
    }
  });

  afterAll(async () => {
    if (app) {
      await cleanupTestDatabase(moduleFixture);
      await app.close();
    }
  });

  it('/api/v1/auth/login (POST) - login admin sucesso', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);

    expect(response.body.message).toBe('Login realizado com sucesso.');
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('/api/v1/auth/login (POST) - login falha com credenciais incorretas', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'wrongpassword' })
      .expect(401);

    expect(response.body.message).toBe('Credenciais inválidas.');
    expect(response.body.data).toBeUndefined();
  });

  it('/api/v1/auth/login (POST) - login falha com usuário inexistente', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password' })
      .expect(401);

    expect(response.body.message).toBe('Credenciais inválidas.');
    expect(response.body.data).toBeUndefined();
  });

  it('/api/v1/auth/login (POST) - login falha com email inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'invalid-email', password: 'password' })
      .expect(400);

    expect(response.body.message).toContain('email must be an email');
  });

  it('/api/v1/auth/login (POST) - login falha com campos vazios', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: '', password: '' })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('/api/v1/users (GET) - deve retornar lista de usuários se autenticado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminAccessToken}`) 
      .expect(200);

    expect(response.body.message).toBe('List of users retrieved successfully.');
    expect(Array.isArray(response.body.data)).toBeTruthy();
    expect(response.body.data.some((u: any) => u.email === 'admin@example.com')).toBeTruthy();
  });

  it('/api/v1/users (GET) - deve falhar se não autenticado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });
});