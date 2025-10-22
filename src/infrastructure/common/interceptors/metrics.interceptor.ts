import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const method = request.method;
    const route = request.route?.path || request.url;
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Increment request counter
    this.metricsService.incrementCounter('http_requests_total', 1, {
      method,
      route,
      user_agent: this.sanitizeUserAgent(userAgent),
    });

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Record response metrics
        this.metricsService.incrementCounter('http_responses_total', 1, {
          method,
          route,
          status_code: statusCode.toString(),
        });

        // Record response time
        this.metricsService.recordTimer('http_request_duration_ms', duration, {
          method,
          route,
          status_code: statusCode.toString(),
        });

        // Record status code distribution
        this.metricsService.incrementCounter('http_status_codes', 1, {
          status_code: statusCode.toString(),
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Record error metrics
        this.metricsService.incrementCounter('http_errors_total', 1, {
          method,
          route,
          error_type: error.constructor.name,
          status_code: statusCode.toString(),
        });

        // Record error response time
        this.metricsService.recordTimer('http_error_duration_ms', duration, {
          method,
          route,
          error_type: error.constructor.name,
        });

        throw error;
      }),
    );
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Extract browser/device info from user agent
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    if (userAgent.includes('Postman')) return 'postman';
    if (userAgent.includes('curl')) return 'curl';
    if (userAgent.includes('wget')) return 'wget';
    
    return 'other';
  }
}
