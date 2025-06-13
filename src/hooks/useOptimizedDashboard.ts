
import { connectionOptimizer } from '@/services/connectionOptimizer';
import { useOptimizedData } from './useOptimizedData';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';

interface DashboardStats {
  activeTrips: number;
  totalTrips: number;
  completedTrips: number;
  plannedTrips: number;
  cancelledTrips: number;
  contractors: number;
  drivers: number;
  vehicles: number;
  totalCargoValue: number;
  completedCargoValue: number;
  totalWeight: number;
  totalVolume: number;
  monthlyStats: Array<{
    month: string;
    trips: number;
    revenue: number;
    weight: number;
    expenses: number;
  }>;
  averageCargoValue: number;
  completionRate: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentTrips?: any[];
}

export const useOptimizedDashboard = () => {
  return useOptimizedData<DashboardData>(
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
