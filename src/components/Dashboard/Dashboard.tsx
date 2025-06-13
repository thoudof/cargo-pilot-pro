
import React, { useMemo } from 'react';
import { DashboardStats } from './DashboardStats';
import { FinancialMetrics } from './FinancialMetrics';
import { DashboardCharts } from './DashboardCharts';
import { RecentTripsSection } from './RecentTripsSection';
import { useDataCache } from '@/hooks/useDataCache';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';

interface DashboardStatsType {
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
  }>;
  averageCargoValue: number;
  completionRate: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
}

const Dashboard: React.FC = () => {
  const { data: stats, loading, error } = useDataCache<DashboardStatsType>(
    'dashboard-stats',
    async () => {
      const result = await optimizedSupabaseService.getDashboardStatsOptimized();
      return result as DashboardStatsType;
    },
    { ttl: 3 * 60 * 1000, immediate: true }
  );

  const defaultStats: DashboardStatsType = useMemo(() => ({
    activeTrips: 0,
    totalTrips: 0,
    completedTrips: 0,
    plannedTrips: 0,
    cancelledTrips: 0,
    contractors: 0,
    drivers: 0,
    vehicles: 0,
    totalCargoValue: 0,
    completedCargoValue: 0,
    totalWeight: 0,
    totalVolume: 0,
    monthlyStats: [],
    averageCargoValue: 0,
    completionRate: 0,
    totalExpenses: 0,
    profit: 0,
    profitMargin: 0
  }), []);

  const dashboardStats = stats || defaultStats;

  const formatCurrency = useMemo(() => (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(value);
  }, []);

  const formatWeight = useMemo(() => (value: number) => {
    return `${value.toLocaleString('ru-RU')} кг`;
  }, []);

  const chartConfig = useMemo(() => ({
    trips: {
      label: "Рейсы",
      color: "hsl(var(--chart-1))"
    },
    revenue: {
      label: "Выручка",
      color: "hsl(var(--chart-2))"
    },
    weight: {
      label: "Вес (т)",
      color: "hsl(var(--chart-3))"
    }
  }), []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Ошибка загрузки данных</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Загрузка данных...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardStats stats={dashboardStats} />
      <FinancialMetrics 
        stats={dashboardStats} 
        formatCurrency={formatCurrency} 
        formatWeight={formatWeight} 
      />
      <DashboardCharts 
        stats={dashboardStats} 
        formatCurrency={formatCurrency} 
        formatWeight={formatWeight} 
        chartConfig={chartConfig} 
      />
      <RecentTripsSection stats={dashboardStats} />
    </div>
  );
};

export { Dashboard };
export default Dashboard;
