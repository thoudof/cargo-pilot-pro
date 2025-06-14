
import { useQuery } from '@tanstack/react-query';
import { connectionOptimizer } from '@/services/connectionOptimizer';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';
import type { Trip } from '@/types';

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
  recentTrips?: Trip[];
}

export const useOptimizedDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: () => connectionOptimizer.preloadCriticalData(),
  });
};

export const useOptimizedTrips = (limit = 100) => {
  return useQuery<Trip[]>({
    queryKey: [`trips-${limit}`],
    queryFn: () => optimizedSupabaseService.getTripsOptimized(limit),
  });
};
