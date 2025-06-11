export class PerformanceService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Caching utilities
  static setCache(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clearCache(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Debouncing utility
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttling utility
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Batch operations
  static async batchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    batchSize: number = 10,
    delay: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(operation);
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to avoid overwhelming the server
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  // Retry mechanism with exponential backoff
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  // Performance monitoring
  static measurePerformance<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      
      try {
        const result = await operation();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        
        // Log slow operations
        if (duration > 1000) {
          console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
        }
        
        resolve(result);
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error);
        reject(error);
      }
    });
  }

  // Memory usage monitoring
  static getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // Connection quality monitoring
  static getConnectionInfo(): any {
    if ('connection' in navigator) {
      return (navigator as any).connection;
    }
    return null;
  }

  // Lazy loading utility
  static createLazyLoader<T>(
    loader: () => Promise<T>
  ): () => Promise<T> {
    let promise: Promise<T> | null = null;
    
    return () => {
      if (!promise) {
        promise = loader();
      }
      return promise;
    };
  }

  // Image optimization
  static optimizeImageUrl(url: string, width?: number, height?: number, quality?: number): string {
    if (!url) return url;
    
    // If using Supabase storage, we can add transformation parameters
    if (url.includes('supabase')) {
      const params = new URLSearchParams();
      
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      if (quality) params.append('quality', quality.toString());
      
      const separator = url.includes('?') ? '&' : '?';
      return params.toString() ? `${url}${separator}${params.toString()}` : url;
    }
    
    return url;
  }

  // Preload critical resources
  static preloadResource(url: string, type: 'image' | 'script' | 'style' = 'image') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'image':
        link.as = 'image';
        break;
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
    }
    
    document.head.appendChild(link);
  }

  // Virtual scrolling helper
  static calculateVisibleItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ) {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );
    
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems - 1, visibleEnd + overscan);
    
    return { start, end, visibleStart, visibleEnd };
  }
}