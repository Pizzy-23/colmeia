import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('🚀 Colmeia API')
    .setDescription(`
      Sistema de cobrança com arquitetura hexagonal, desenvolvido em NestJS.
      
      ## 🔐 Autenticação
      Todos os endpoints (exceto login) requerem autenticação via Bearer Token.
      
      ## 🛡️ Rate Limiting
      - Auth endpoints: 5 requests/minuto
      - API endpoints: 100 requests/minuto
      - Webhook endpoints: 10 requests/minuto
      
      ## 🪝 Webhooks
      Sistema de notificações em tempo real para eventos importantes.
      
      ## 📊 Métricas
      Endpoint de métricas disponível para monitoramento.
    `)
    .setVersion('1.0.0')
    .setContact(
      'Equipe Colmeia',
      'https://github.com/colmeia',
      'contato@colmeia.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Auth', 'Endpoints de autenticação e autorização')
    .addTag('Users', 'Gestão de usuários do sistema')
    .addTag('Customers', 'Gestão de clientes')
    .addTag('Charges', 'Gestão de cobranças')
    .addTag('Webhooks', 'Sistema de notificações')
    .addTag('Metrics', 'Métricas e monitoramento')
    .addServer('http://localhost:3000', 'Desenvolvimento')
    .addServer('https://api.colmeia.com', 'Produção')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Colmeia API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #e0234e; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    `,
  });
}
