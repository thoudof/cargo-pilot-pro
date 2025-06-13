
import React from 'react';
import { DashboardStats } from './DashboardStats';
import { FinancialMetrics } from './FinancialMetrics';
import { DashboardCharts } from './DashboardCharts';
import { RecentTripsSection } from './RecentTripsSection';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard: React.FC = () => {
  const { data: stats, loading, error } = useDashboardData();

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Ошибка загрузки данных</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
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
};

export { Dashboard };
export default Dashboard;
