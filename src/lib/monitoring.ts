export class MonitoringService {
  private static metrics: Map<string, any[]> = new Map();
  private static readonly MAX_METRICS = 1000;

  // Performance monitoring
  static recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags: tags || {}
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only the last MAX_METRICS entries
    if (metricArray.length > this.MAX_METRICS) {
      metricArray.shift();
    }
  }

  // Database operation monitoring
  static recordDatabaseOperation(operation: string, duration: number, success: boolean) {
    this.recordMetric('database_operation_duration', duration, {
      operation,
      success: success.toString()
    });

    this.recordMetric('database_operation_count', 1, {
      operation,
      success: success.toString()
    });
  }

  // API call monitoring
  static recordApiCall(endpoint: string, method: string, duration: number, statusCode: number) {
    this.recordMetric('api_call_duration', duration, {
      endpoint,
      method,
      status_code: statusCode.toString()
    });

    this.recordMetric('api_call_count', 1, {
      endpoint,
      method,
      status_code: statusCode.toString()
    });
  }

  // User action monitoring
  static recordUserAction(action: string, userId?: string) {
    this.recordMetric('user_action', 1, {
      action,
      user_id: userId || 'anonymous'
    });
  }

  // Error monitoring
  static recordError(error: Error, context?: string, userId?: string) {
    this.recordMetric('error_count', 1, {
      error_type: error.name,
      context: context || 'unknown',
      user_id: userId || 'anonymous'
    });
  }

  // Page load monitoring
  static recordPageLoad(page: string, duration: number) {
    this.recordMetric('page_load_duration', duration, { page });
  }

  // Component render monitoring
  static recordComponentRender(component: string, duration: number) {
    this.recordMetric('component_render_duration', duration, { component });
  }

  // Memory usage monitoring
  static recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize);
      this.recordMetric('memory_total', memory.totalJSHeapSize);
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
    }
  }

  // Network monitoring
  static recordNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('network_downlink', connection.downlink || 0);
      this.recordMetric('network_rtt', connection.rtt || 0);
      this.recordMetric('network_effective_type', 1, {
        type: connection.effectiveType || 'unknown'
      });
    }
  }

  // Get metrics summary
  static getMetricsSummary(name: string, timeWindow?: number): any {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const now = Date.now();
    const filteredMetrics = timeWindow 
      ? metrics.filter(m => now - m.timestamp <= timeWindow)
      : metrics;

    if (filteredMetrics.length === 0) {
      return null;
    }

    const values = filteredMetrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: filteredMetrics.length,
      sum,
      avg,
      min,
      max,
      p50,
      p95,
      p99
    };
  }

  // Get all metrics
  static getAllMetrics(): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    this.metrics.forEach((value, key) => {
      result[key] = [...value];
    });
    return result;
  }

  // Clear metrics
  static clearMetrics(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  // Health check
  static getHealthStatus(): any {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    // Check for recent errors
    const errorMetrics = this.metrics.get('error_count') || [];
    const recentErrors = errorMetrics.filter(m => m.timestamp > fiveMinutesAgo);

    // Check for slow operations
    const dbMetrics = this.metrics.get('database_operation_duration') || [];
    const recentDbOps = dbMetrics.filter(m => m.timestamp > fiveMinutesAgo);
    const slowDbOps = recentDbOps.filter(m => m.value > 1000); // > 1 second

    // Check memory usage
    const memoryMetrics = this.metrics.get('memory_used') || [];
    const latestMemory = memoryMetrics[memoryMetrics.length - 1];

    return {
      status: recentErrors.length > 10 || slowDbOps.length > 5 ? 'unhealthy' : 'healthy',
      timestamp: now,
      checks: {
        recent_errors: recentErrors.length,
        slow_db_operations: slowDbOps.length,
        memory_usage_mb: latestMemory ? Math.round(latestMemory.value / 1024 / 1024) : null,
        total_metrics: this.metrics.size
      }
    };
  }

  // Start automatic monitoring
  static startAutoMonitoring(interval: number = 60000) {
    setInterval(() => {
      this.recordMemoryUsage();
      this.recordNetworkInfo();
    }, interval);
  }

  // Export metrics for external monitoring systems
  static exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.exportPrometheusFormat();
    }

    return JSON.stringify(this.getAllMetrics(), null, 2);
  }

  private static exportPrometheusFormat(): string {
    let output = '';
    
    this.metrics.forEach((metrics, name) => {
      const latestMetric = metrics[metrics.length - 1];
      if (latestMetric) {
        const tags = Object.entries(latestMetric.tags || {})
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        
        output += `# TYPE ${name} gauge\n`;
        output += `${name}{${tags}} ${latestMetric.value} ${latestMetric.timestamp}\n`;
      }
    });

    return output;
  }
}