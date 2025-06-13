
import { supabase } from '@/integrations/supabase/client';
import { globalCache } from '@/hooks/useDataCache';

class OptimizedSupabaseService {
  private batchSize = 50;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  // Батч-запрос для расходов по рейсам
  async getTripExpensesBatch(tripIds: string[]): Promise<Record<string, number>> {
    const cacheKey = `trip-expenses-batch-${tripIds.sort().join(',')}`;
    
    // Проверяем кэш
    const cached = globalCache.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('trip_expenses')
        .select('trip_id, amount')
        .in('trip_id', tripIds);

      if (error) throw error;

      const expensesMap = data?.reduce((acc, expense) => {
        if (!acc[expense.trip_id]) {
          acc[expense.trip_id] = 0;
        }
        acc[expense.trip_id] += expense.amount;
        return acc;
      }, {} as Record<string, number>) || {};

      // Кэшируем результат на 3 минуты
      globalCache.set(cacheKey, expensesMap, 3 * 60 * 1000);
      
      return expensesMap;
    } catch (error) {
      console.error('Failed to get trip expenses batch:', error);
      return {};
    }
  }

  // Оптимизированный запрос рейсов с лимитом
  async getTripsOptimized(limit = 100, offset = 0) {
    const cacheKey = `trips-optimized-${limit}-${offset}`;
    
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          contractors!inner(company_name),
          drivers(name, phone, license),
          vehicles(brand, model, license_plate)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      globalCache.set(cacheKey, data, 2 * 60 * 1000); // 2 минуты кэш
      return data;
    } catch (error) {
      console.error('Failed to get trips optimized:', error);
      throw error;
    }
  }

  // Пакетная обработка запросов
  async addToQueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Обрабатываем запросы порциями
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, this.batchSize);
        
        // Выполняем запросы параллельно в рамках батча
        await Promise.allSettled(batch.map(request => request()));
        
        // Небольшая пауза между батчами
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Инвалидация кэша
  invalidateCache(pattern?: string) {
    if (pattern) {
      // Инвалидация по паттерну будет добавлена при необходимости
      globalCache.clear();
    } else {
      globalCache.clear();
    }
  }
}

export const optimizedSupabaseService = new OptimizedSupabaseService();
