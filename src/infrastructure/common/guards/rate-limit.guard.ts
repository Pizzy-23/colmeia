import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @Reflector() reflector: Reflector,
  ) {
    super({}, reflector);
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(context, request);
    
    try {
      const totalHits = await this.storageService.increment(key, ttl);
      
      if (totalHits > limit) {
        throw new HttpException(
          {
            success: false,
            message: 'Too many requests',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            retryAfter: Math.ceil(ttl / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Fallback if storage fails
      return true;
    }
  }

  private generateKey(context: ExecutionContext, request: any): string {
    const user = request.user;
    const ip = request.ip || request.connection.remoteAddress;
    
    if (user?.id) {
      return `rate_limit:user:${user.id}`;
    }
    
    return `rate_limit:ip:${ip}`;
  }
}
