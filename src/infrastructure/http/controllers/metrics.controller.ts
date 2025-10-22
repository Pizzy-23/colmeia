import { Controller, Get, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from '../../common/services/metrics.service';
import { AuthGuard } from '../../../application/modules/auth/guards/auth.guard';
import { RolesGuard } from '../../../application/modules/auth/guards/roles.guard';
import { Roles } from '../../../application/modules/auth/decorators/roles.decorator';
import { RoleEnum } from '../../../domain/constants/roles.enum';

@Controller('metrics')
@UseGuards(AuthGuard, RolesGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Roles(RoleEnum.ADMIN)
  async getMetrics(@Res() res: Response) {
    const metrics = this.metricsService.getMetrics();
    
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Metrics retrieved successfully.',
      data: metrics,
    });
  }

  @Get('summary')
  @Roles(RoleEnum.ADMIN)
  async getSummary(@Res() res: Response) {
    const summary = this.metricsService.getSummary();
    
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Metrics summary retrieved successfully.',
      data: summary,
    });
  }

  @Get('prometheus')
  @Roles(RoleEnum.ADMIN)
  async getPrometheusMetrics(@Res() res: Response) {
    const metrics = this.metricsService.getMetrics();
    const summary = this.metricsService.getSummary();
    
    let prometheusOutput = '';
    
    // Convert metrics to Prometheus format
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        prometheusOutput += `# TYPE ${key} counter\n`;
        prometheusOutput += `${key} ${value}\n`;
      }
    }
    
    // Add summary metrics
    for (const [key, value] of Object.entries(summary)) {
      if (typeof value === 'object' && value !== null) {
        prometheusOutput += `# TYPE ${key}_count counter\n`;
        prometheusOutput += `${key}_count ${value.count || 0}\n`;
        
        if (value.min !== undefined) {
          prometheusOutput += `# TYPE ${key}_min gauge\n`;
          prometheusOutput += `${key}_min ${value.min}\n`;
        }
        
        if (value.max !== undefined) {
          prometheusOutput += `# TYPE ${key}_max gauge\n`;
          prometheusOutput += `${key}_max ${value.max}\n`;
        }
        
        if (value.avg !== undefined) {
          prometheusOutput += `# TYPE ${key}_avg gauge\n`;
          prometheusOutput += `${key}_avg ${value.avg}\n`;
        }
      }
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.status(HttpStatus.OK).send(prometheusOutput);
  }
}
