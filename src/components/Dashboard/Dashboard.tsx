
import React, { useMemo } from 'react';
import { DashboardStats } from './DashboardStats';
import { FinancialMetrics } from './FinancialMetrics';
import { DashboardCharts } from './DashboardCharts';
import { RecentTripsSection } from './RecentTripsSection';
import { useDataCache } from '@/hooks/useDataCache';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';

const Dashboard: React.FC = () => {
  // Используем кэширование для статистики дашборда
  const { data: stats, loading } = useDataCache(
    'dashboard-stats',
    () => optimizedSupabaseService.getDashboardStatsOptimized(),
    { ttl: 3 * 60 * 1000 } // 3 минуты кэш
  );

  const defaultStats = {
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
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
