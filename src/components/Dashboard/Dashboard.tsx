
import React, { useState, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { DashboardStats } from './DashboardStats';
import { FinancialMetrics } from './FinancialMetrics';
import { DashboardCharts } from './DashboardCharts';
import { RecentTripsSection } from './RecentTripsSection';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await supabaseService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Основные метрики */}
      <DashboardStats stats={stats} />

      {/* Финансовые метрики */}
      <FinancialMetrics 
        stats={stats} 
        formatCurrency={formatCurrency} 
        formatWeight={formatWeight} 
      />

      {/* Графики */}
      <DashboardCharts 
        stats={stats} 
        formatCurrency={formatCurrency} 
        formatWeight={formatWeight} 
        chartConfig={chartConfig} 
      />

      {/* Секция последних рейсов */}
      <RecentTripsSection stats={stats} />
    </div>
  );
};

export { Dashboard };
export default Dashboard;
