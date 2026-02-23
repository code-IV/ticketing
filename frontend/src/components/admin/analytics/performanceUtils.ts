// Performance optimization utilities for analytics components

// Debounce function to prevent excessive API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: any[]) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// Throttle function to limit update frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: any[]) => void {
  let inThrottle: boolean;
  
  return (...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Memoization cache for expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: any[]) => string
): T {
  const cache = new Map<string, any>();
  
  return (...args: any[]) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

// Format large numbers for better readability
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Calculate percentage change with direction
export function calculateChange(current: number, previous: number): {
  change: number;
  isPositive: boolean;
  percentage: number;
  isSignificant: boolean;
} {
  const change = current - previous;
  const percentage = previous !== 0 ? Math.abs((change / previous) * 100) : 0;
  
  return {
    change,
    isPositive: change > 0,
    percentage,
    isSignificant: Math.abs(percentage) > 5 // Consider 5% as significant
  };
}

// Optimized data aggregation
export function aggregateData<T>(
  data: T[],
  groupBy: keyof T,
  aggregator: (items: T[]) => any
): Map<string, any> {
  const groups = new Map<string, T[]>();
  
  // Group data
  data.forEach(item => {
    const key = String(item[groupBy]);
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  });
  
  // Aggregate each group
  const result = new Map<string, any>();
  groups.forEach((items, key) => {
    result.set(key, aggregator(items));
  });
  
  return result;
}

// Lazy loading for large datasets
export function createLazyLoader<T>(
  loader: () => Promise<T[]>,
  threshold: number = 100
): {
  load: () => Promise<T[]>;
  preload: () => Promise<void>;
} {
  let cachedData: T[] | null = null;
  let isLoading = false;
  
  const load = async (): Promise<T[]> => {
    if (cachedData && !isLoading) {
      return cachedData;
    }
    
    isLoading = true;
    try {
      const data = await loader();
      cachedData = data;
      return data;
    } finally {
      isLoading = false;
    }
  };
  
  const preload = async (): Promise<void> => {
    if (!cachedData) {
      await load();
    }
  };
  
  return { load, preload };
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  
  static startTiming(name: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(performance.now());
  }
  
  static endTiming(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length < 2) {
      return 0;
    }
    
    return performance.now() - times[times.length - 2];
  }
  
  static getAverageTiming(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length < 2) {
      return 0;
    }
    
    const durations = [];
    for (let i = 1; i < times.length; i++) {
      durations.push(times[i] - times[i - 1]);
    }
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }
  
  static getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    this.metrics.forEach((times, name) => {
      if (times.length >= 2) {
        const durations = [];
        for (let i = 1; i < times.length; i++) {
          durations.push(times[i] - times[i - 1]);
        }
        
        result[name] = {
          average: durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
          count: times.length - 1
        };
      }
    });
    
    return result;
  }
}
