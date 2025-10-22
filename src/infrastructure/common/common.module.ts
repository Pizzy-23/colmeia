import { Module, Global } from '@nestjs/common';
import { DomainEventsPublisher } from '../../domain/domain-events/domain-events-publisher';
import { DomainEventsStore } from '../../domain/domain-events/domain-events-store';
import { DomainEventsSubscriber } from '../../domain/domain-events/domain-events-subscriber';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CustomCacheInterceptor } from './interceptors/custom-cache.interceptor';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 1000,
      isGlobal: true,
    }),
  ],
  providers: [
    DomainEventsPublisher,
    DomainEventsStore,
    DomainEventsSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomCacheInterceptor,
    },
  ],
})
export class SharedModule {}
