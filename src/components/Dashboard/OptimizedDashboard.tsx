
import React from 'react';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';
import { RecentTripsSection } from './RecentTripsSection';
import { formatCurrency, formatWeight } from '@/lib/formatters';
import { useConnectionQuality } from '@/hooks/useConnectionQuality';

export const OptimizedDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useOptimizedDashboard();
  const connectionQuality = useConnectionQuality();

  const chartConfig = {
    trips: {
      label: "Рейсы",
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: "Выручка",
      color: "hsl(var(--chart-2))",
    },
    weight: {
      label: "Вес (т)",
      color: "hsl(var(--chart-3))",
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ConnectionStatus 
          quality={connectionQuality}
          loading={isLoading}
          error={error ? error.message : null}
          onRetry={refetch}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-3 text-lg">
              {connectionQuality === 'very_slow' ? 'Медленное соединение, загружаем данные...' : 'Загрузка данных...'}
            </p>
            {connectionQuality !== 'fast' && (
              <p className="text-sm text-muted-foreground mt-2">
                Это может занять больше времени из-за качества соединения
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConnectionStatus 
        quality={connectionQuality}
        loading={isLoading}
        error={error ? error.message : null}
        onRetry={refetch}
      />
      
      {data?.stats && <DashboardStats stats={data.stats} />}
      {data?.stats?.monthlyStats && (
        <DashboardCharts 
          stats={{ monthlyStats: data.stats.monthlyStats }}
          formatCurrency={formatCurrency}
          formatWeight={formatWeight}
          chartConfig={chartConfig}
        />
      )}
      {data?.stats && <RecentTripsSection stats={data.stats} />}
    </div>
  );
};
