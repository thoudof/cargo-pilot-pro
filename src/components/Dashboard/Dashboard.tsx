
import React, { memo } from 'react';
import { DashboardStats } from './DashboardStats';
import { FinancialMetrics } from './FinancialMetrics';
import { DashboardCharts } from './DashboardCharts';
import { RecentTripsSection } from './RecentTripsSection';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useErrorBoundary } from '@/hooks/useErrorBoundary';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const Dashboard: React.FC = memo(() => {
  const { data: stats, loading, error } = useDashboardData();
  const { error: runtimeError, resetError } = useErrorBoundary();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toLocaleString('ru-RU')} кг`;
  };

  const chartConfig = {
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
  };

  if (runtimeError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">Произошла ошибка</p>
          <p className="text-sm text-muted-foreground mb-4">{runtimeError.message}</p>
        </div>
        <Button onClick={resetError} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">Ошибка загрузки данных</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить страницу
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Панель управления" 
          description="Обзор ключевых показателей"
        />
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Панель управления" 
        description="Обзор ключевых показателей"
        actions={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Обновить</span>
          </Button>
        }
      />
      
      <DashboardStats stats={stats} />
      
      <FinancialMetrics 
        stats={stats} 
        formatCurrency={formatCurrency} 
        formatWeight={formatWeight} 
      />
      
      <DashboardCharts 
        stats={stats} 
        formatCurrency={formatCurrency} 
        formatWeight={formatWeight} 
        chartConfig={chartConfig} 
      />
      
      <RecentTripsSection stats={stats} />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export { Dashboard };
export default Dashboard;
