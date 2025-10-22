import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IDEMPOTENCY_KEY } from '../decorators/idempotency.decorator';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly processedRequests = new Map<string, any>();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const idempotencyKey = this.reflector.getAllAndOverride<string>(IDEMPOTENCY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!idempotencyKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const key = request.headers['idempotency-key'] || request.headers['x-idempotency-key'];

    if (!key) {
      return next.handle();
    }

    const cacheKey = `${idempotencyKey}:${key}`;

    if (this.processedRequests.has(cacheKey)) {
      const cachedResult = this.processedRequests.get(cacheKey);
      return new Observable(subscriber => {
        subscriber.next(cachedResult);
        subscriber.complete();
      });
    }

    return new Observable(subscriber => {
      next.handle().subscribe({
        next: (result) => {
          this.processedRequests.set(cacheKey, result);
          subscriber.next(result);
          subscriber.complete();
        },
        error: (error) => {
          subscriber.error(error);
        },
      });
    });
  }
}
