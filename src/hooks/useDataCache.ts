
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDataCacheOptions {
  ttl?: number;
  immediate?: boolean;
}

export const useDataCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseDataCacheOptions = {}
) => {
  const { ttl = 5 * 60 * 1000, immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (): Promise<T | null> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (!abortController.signal.aborted) {
        setData(result);
        setError(null);
      }
      
      return result;
    } catch (err) {
      if (!abortController.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error(`Fetch error for key ${key}:`, error);
      }
      return null;
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [key, fetchFn]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    refresh
  };
};
