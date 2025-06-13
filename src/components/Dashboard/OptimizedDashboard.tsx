
import React from 'react';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';
import { RecentTripsSection } from './RecentTripsSection';

export const OptimizedDashboard: React.FC = () => {
  const { data, loading, error, connectionQuality, retry } = useOptimizedDashboard();

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <ConnectionStatus 
          quality={connectionQuality}
          loading={loading}
          error={error}
          onRetry={retry}
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
        loading={loading}
        error={error}
        onRetry={retry}
      />
      
      {data?.stats && <DashboardStats data={data.stats} />}
      {data?.stats?.monthlyStats && <DashboardCharts data={data.stats.monthlyStats} />}
      {data?.recentTrips && <RecentTripsSection trips={data.recentTrips.slice(0, 5)} />}
    </div>
  );
};
