
// Сервис для оптимизации соединения и загрузки данных
class ConnectionOptimizer {
  private retryAttempts = 3;
  private baseDelay = 1000;
  private maxDelay = 5000;

  // Проверка качества соединения
  async checkConnectionQuality(): Promise<'fast' | 'slow' | 'very_slow'> {
    const start = performance.now();
    
    try {
      const response = await fetch('https://erwlnexwbrvvnvxtkeqg.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const latency = performance.now() - start;
      
      if (latency < 500) return 'fast';
      if (latency < 2000) return 'slow';
      return 'very_slow';
    } catch (error) {
      console.warn('Connection quality check failed:', error);
      return 'very_slow';
    }
  }

  // Retry логика с экспоненциальным backoff
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${context} failed (attempt ${attempt}/${this.retryAttempts}):`, error);
        
        if (attempt < this.retryAttempts) {
          const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  // Батчинг запросов для уменьшения количества обращений к серверу
  private requestQueue: Map<string, Promise<any>> = new Map();
  
  async batchRequest<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }
    
    const promise = this.withRetry(operation, `batch-${key}`)
      .finally(() => {
        // Удаляем из очереди после завершения
        setTimeout(() => this.requestQueue.delete(key), 1000);
      });
    
    this.requestQueue.set(key, promise);
    return promise;
  }

  // Предзагрузка критически важных данных
  async preloadCriticalData() {
    const connectionQuality = await this.checkConnectionQuality();
    console.log('Connection quality:', connectionQuality);
    
    // Адаптируем стратегию загрузки в зависимости от качества соединения
    if (connectionQuality === 'very_slow') {
      // Загружаем только самое необходимое
      return this.loadMinimalData();
    } else if (connectionQuality === 'slow') {
      // Загружаем данные порциями
      return this.loadDataInChunks();
    } else {
      // Загружаем все как обычно
      return this.loadAllData();
    }
  }

  private async loadMinimalData() {
    // Загружаем только основную статистику
    const { optimizedSupabaseService } = await import('./optimizedSupabaseService');
    const stats = await optimizedSupabaseService.getDashboardStatsOptimized();
    return { stats };
  }

  private async loadDataInChunks() {
    // Загружаем данные небольшими порциями
    const { optimizedSupabaseService } = await import('./optimizedSupabaseService');
    
    const [stats, recentTrips] = await Promise.all([
      optimizedSupabaseService.getDashboardStatsOptimized(),
      optimizedSupabaseService.getTripsOptimized(20) // Ограничиваем количество
    ]);
    
    return { stats, recentTrips };
  }

  private async loadAllData() {
    // Загружаем все данные как обычно
    const { optimizedSupabaseService } = await import('./optimizedSupabaseService');
    
    const [stats, recentTrips] = await Promise.all([
      optimizedSupabaseService.getDashboardStatsOptimized(),
      optimizedSupabaseService.getTripsOptimized(100)
    ]);
    
    return { stats, recentTrips };
  }
}

export const connectionOptimizer = new ConnectionOptimizer();
