
import { useState, useEffect } from 'react';
import { connectionOptimizer } from '@/services/connectionOptimizer';

interface OptimizedDataOptions {
  enableRetry?: boolean;
  enablePreload?: boolean;
  cacheKey?: string;
}

export const useOptimizedData = <T>(
  fetchFn: () => Promise<T>,
  options: OptimizedDataOptions = {}
) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'very_slow'>('fast');

  const { enableRetry = true, cacheKey } = options;

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Проверяем качество соединения
        const quality = await connectionOptimizer.checkConnectionQuality();
        if (mounted) {
          setConnectionQuality(quality);
        }

        let result: T;
        
        if (enableRetry) {
          if (cacheKey) {
            result = await connectionOptimizer.batchRequest(cacheKey, fetchFn);
          } else {
            result = await connectionOptimizer.withRetry(fetchFn, 'data-fetch');
          }
        } else {
          result = await fetchFn();
        }

        if (mounted) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load optimized data:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchFn, enableRetry, cacheKey]);

  const retry = () => {
    setError(null);
    setLoading(true);
    // Перезапускаем эффект
    const loadData = async () => {
      try {
        const result = enableRetry 
          ? await connectionOptimizer.withRetry(fetchFn, 'manual-retry')
          : await fetchFn();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  };

  return { data, loading, error, connectionQuality, retry };
};
