import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Injectable,
  ExecutionContext,
  Inject,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import {
  CACHE_CUSTOM_KEY,
  CACHE_CUSTOM_TTL,
} from '../decorators/cacheable.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    reflector: Reflector,
  ) {
    super(cacheManager, reflector);
  }
  trackBy(context: ExecutionContext): string | undefined {
    const cacheKey = this.reflector.get<string>(
      CACHE_CUSTOM_KEY,
      context.getHandler(),
    );

    if (cacheKey) {
      // Se você precisar de chaves dinâmicas baseadas em parâmetros da requisição,
      // você pode fazer isso aqui. Exemplo:
      // const httpContext = context.switchToHttp();
      // const request = httpContext.getRequest();
      // const paramId = request.params?.id; // Supondo um ID na rota
      // return paramId ? `${cacheKey}_${paramId}` : cacheKey;
      return cacheKey;
    }

    return super.trackBy(context);
  }
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const cacheTTL = this.reflector.get<number>(
      CACHE_CUSTOM_TTL,
      context.getHandler(),
    );
    if (cacheTTL !== undefined) {
      const httpContext = context.switchToHttp();
      const request = httpContext.getRequest();
      request.ttl = cacheTTL;
    }
    return super.intercept(context, next);
  }
}
