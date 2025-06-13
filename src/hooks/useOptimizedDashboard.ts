
import { connectionOptimizer } from '@/services/connectionOptimizer';
import { useOptimizedData } from './useOptimizedData';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';

export const useOptimizedDashboard = () => {
  return useOptimizedData(
    () => connectionOptimizer.preloadCriticalData(),
    {
      enableRetry: true,
      cacheKey: 'dashboard-data'
    }
  );
};

export const useOptimizedTrips = (limit = 100) => {
  return useOptimizedData(
    () => optimizedSupabaseService.getTripsOptimized(limit),
    {
      enableRetry: true,
      cacheKey: `trips-${limit}`
    }
  );
};
