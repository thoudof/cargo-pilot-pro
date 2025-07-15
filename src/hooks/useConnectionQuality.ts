
import { useState, useEffect } from 'react';
import { connectionOptimizer } from '@/services/connectionOptimizer';

export const useConnectionQuality = () => {
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'very_slow'>('fast');

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;
    
    const check = async () => {
      try {
        const quality = await connectionOptimizer.checkConnectionQuality();
        if (mounted) {
          setConnectionQuality(quality);
        }
      } catch (error) {
        console.error("Failed to check connection quality:", error);
        if (mounted) {
          setConnectionQuality('slow'); // Default to slow on error
        }
      }
    };
    
    // Проверяем сразу
    check();
    
    // Устанавливаем интервал только если компонент еще смонтирован
    if (mounted) {
      intervalId = setInterval(check, 60000); // Увеличиваем интервал до 1 минуты
    }

    return () => { 
      mounted = false; 
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return connectionQuality;
};
