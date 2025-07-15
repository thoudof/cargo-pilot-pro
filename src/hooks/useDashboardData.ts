
import { useState, useEffect } from 'react';
import { dashboardService, DashboardStats } from '@/services/dashboardService';
import { useAuth } from '@/components/Auth/AuthProvider';

const defaultStats: DashboardStats = {
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

export const useDashboardData = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false); // Важно: сбрасываем loading если нет пользователя
      return;
    }

    let mounted = true;
    
    // Проверяем, нужно ли загружать данные повторно
    if (data !== defaultStats && !loading) {
      return; // Данные уже загружены
    }

    setLoading(true);
    setError(null);

    console.log('Starting dashboard data fetch for user:', user.id);

    const fetchData = async () => {
      try {
        const stats = await dashboardService.getDashboardStats();
        
        if (mounted) {
          setData(stats);
          setError(null);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Добавляем небольшую задержку для предотвращения множественных запросов
    const timeoutId = setTimeout(fetchData, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user?.id, authLoading]); // Используем user.id вместо всего объекта user

  return { data, loading, error };
};
