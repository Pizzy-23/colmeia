import { SetMetadata, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

export const CACHE_CUSTOM_KEY = 'cache_custom_key';
export const CACHE_CUSTOM_TTL = 'cache_custom_ttl';

export function Cacheable(key: string, ttl: number = 60000) { // Default TTL de 1 minuto
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    SetMetadata(CACHE_CUSTOM_KEY, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_CUSTOM_TTL, ttl)(target, propertyKey, descriptor);
  };
}