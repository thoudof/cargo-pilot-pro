// Утилиты для оптимизации производительности

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Очистка кэша браузера
export const clearBrowserCache = () => {
  try {
    // Очищаем localStorage
    localStorage.clear();
    
    // Очищаем sessionStorage
    sessionStorage.clear();
    
    // Перезагружаем страницу с принудительным обновлением кэша
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear browser cache:', error);
    // Fallback - обычная перезагрузка
    window.location.reload();
  }
};

// Проверка производительности сети
export const measureNetworkPerformance = async (): Promise<number> => {
  const start = performance.now();
  
  try {
    // Простой запрос для измерения скорости
    await fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors'
    });
    
    return performance.now() - start;
  } catch (error) {
    console.warn('Failed to measure network performance:', error);
    return 1000; // Возвращаем большое значение при ошибке
  }
};

// Проверка доступности памяти
export const checkMemoryUsage = (): { available: boolean; warning: boolean } => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize;
    const limit = memory.jsHeapSizeLimit;
    
    const usage = used / limit;
    
    return {
      available: usage < 0.9, // Менее 90% использовано
      warning: usage > 0.7     // Больше 70% - предупреждение
    };
  }
  
  return { available: true, warning: false };
};