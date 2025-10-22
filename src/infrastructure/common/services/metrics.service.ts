import { Injectable, Logger } from '@nestjs/common';

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface CounterMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export interface TimerMetric {
  name: string;
  duration: number;
  tags?: Record<string, string>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, any> = new Map();

  // Counter metrics
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);
    
    this.logger.debug(`Counter ${name} incremented by ${value}`, { tags });
  }

  // Timer metrics
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const current = this.metrics.get(key) || [];
    current.push(duration);
    this.metrics.set(key, current);
    
    this.logger.debug(`Timer ${name} recorded: ${duration}ms`, { tags });
  }

  // Gauge metrics
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    this.metrics.set(key, value);
    
    this.logger.debug(`Gauge ${name} set to ${value}`, { tags });
  }

  // Get metrics
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    
    return result;
  }

  // Get specific metric
  getMetric(name: string, tags?: Record<string, string>): any {
    const key = this.buildKey(name, tags);
    return this.metrics.get(key);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.logger.debug('All metrics cleared');
  }

  // Get metrics summary
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    for (const [key, value] of this.metrics.entries()) {
      if (Array.isArray(value)) {
        // Timer metrics
        summary[key] = {
          count: value.length,
          min: Math.min(...value),
          max: Math.max(...value),
          avg: value.reduce((a, b) => a + b, 0) / value.length,
          p95: this.percentile(value, 0.95),
          p99: this.percentile(value, 0.99),
        };
      } else {
        // Counter or Gauge metrics
        summary[key] = value;
      }
    }
    
    return summary;
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    return `${name}{${tagString}}`;
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }
}
