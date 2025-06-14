
import { useState, useEffect } from 'react';
import { connectionOptimizer } from '@/services/connectionOptimizer';

export const useConnectionQuality = () => {
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'very_slow'>('fast');

  useEffect(() => {
    let mounted = true;
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
    
    check();
    const intervalId = setInterval(check, 30000); // Check every 30 seconds

    return () => { 
      mounted = false; 
      clearInterval(intervalId);
    };
  }, []);

  return connectionQuality;
};
