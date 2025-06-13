
import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 минут

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const globalCache = new DataCache();

export const useDataCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    immediate?: boolean;
    dependencies?: any[];
  } = {}
) => {
  const { ttl = 5 * 60 * 1000, immediate = true, dependencies = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const lastFetchKeyRef = useRef<string>('');

  const fetchData = useCallback(async (forceRefresh = false): Promise<T | null> => {
    const currentKey = `${key}-${JSON.stringify(dependencies)}`;
    
    // Предотвращаем повторные запросы
    if (!forceRefresh && lastFetchKeyRef.current === currentKey) {
      return data;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!forceRefresh && globalCache.has(currentKey)) {
      const cachedData = globalCache.get<T>(currentKey);
      if (cachedData && mountedRef.current) {
        setData(cachedData);
        setError(null);
        lastFetchKeyRef.current = currentKey;
        return cachedData;
      }
    }

    if (!mountedRef.current) return null;

    setLoading(true);
    setError(null);
    lastFetchKeyRef.current = currentKey;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await fetchFn();
      
      if (!abortController.signal.aborted && mountedRef.current) {
        globalCache.set(currentKey, result, ttl);
        setData(result);
        setError(null);
      }
      
      return result;
    } catch (err) {
      if (!abortController.signal.aborted && mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error(`Cache fetch error for key ${key}:`, error);
      }
      return null;
    } finally {
      if (!abortController.signal.aborted && mountedRef.current) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [key, ttl, fetchFn, data, dependencies]);

  const invalidate = useCallback(() => {
    const currentKey = `${key}-${JSON.stringify(dependencies)}`;
    globalCache.delete(currentKey);
    lastFetchKeyRef.current = '';
  }, [key, dependencies]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (immediate) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    refresh,
    invalidate
  };
};

export { globalCache };
