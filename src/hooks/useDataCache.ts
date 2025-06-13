
import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();

export const useDataCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { ttl = 5 * 60 * 1000 } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Проверяем кэш
      const cached = cache.get(key);
      if (cached && Date.now() < cached.timestamp + cached.ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Загружаем новые данные
      const result = await fetchFn();
      
      // Сохраняем в кэш
      cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl
      });
      
      setData(result);
    } catch (err) {
      console.error(`Error fetching data for key ${key}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cache.delete(key);
    return fetchData();
  }, [key, fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
  }, [key]);

  return { data, loading, error, refetch, invalidate };
};
