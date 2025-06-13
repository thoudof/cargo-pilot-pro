
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

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

const globalCache = new DataCache();

// Очистка кэша каждые 5 минут
let cleanupInterval: NodeJS.Timeout | null = null;

if (typeof window !== 'undefined' && !cleanupInterval) {
  cleanupInterval = setInterval(() => {
    globalCache.cleanup();
  }, 5 * 60 * 1000);
}

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
  const fetchFnRef = useRef(fetchFn);
  
  // Обновляем fetchFn без перерендера
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async (forceRefresh = false): Promise<T | null> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!forceRefresh && globalCache.has(key)) {
      const cachedData = globalCache.get<T>(key);
      if (cachedData && mountedRef.current) {
        setData(cachedData);
        setError(null);
        return cachedData;
      }
    }

    if (!mountedRef.current) return null;

    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await fetchFnRef.current();
      
      if (!abortController.signal.aborted && mountedRef.current) {
        globalCache.set(key, result, ttl);
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
  }, [key, ttl]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
  }, [key]);

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
  }, [fetchData, immediate, ...dependencies]);

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
