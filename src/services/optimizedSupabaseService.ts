
import { supabase } from '@/integrations/supabase/client';
import { globalCache } from '@/hooks/useDataCache';

class OptimizedSupabaseService {
  private batchSize = 50;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  // Expose supabase client for direct access
  get supabase() {
    return supabase;
  }

  // Батч-запрос для расходов по рейсам
  async getTripExpensesBatch(tripIds: string[]): Promise<Record<string, number>> {
    const cacheKey = `trip-expenses-batch-${tripIds.sort().join(',')}`;
    
    // Проверяем кэш
    const cached = globalCache.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('trip_expenses')
        .select('trip_id, amount')
        .in('trip_id', tripIds);

      if (error) throw error;

      const expensesMap = data?.reduce((acc, expense) => {
        if (!acc[expense.trip_id]) {
          acc[expense.trip_id] = 0;
        }
        acc[expense.trip_id] += expense.amount;
        return acc;
      }, {} as Record<string, number>) || {};

      // Кэшируем результат на 3 минуты
      globalCache.set(cacheKey, expensesMap, 3 * 60 * 1000);
      
      return expensesMap;
    } catch (error) {
      console.error('Failed to get trip expenses batch:', error);
      return {};
    }
  }

  // Оптимизированный запрос рейсов с лимитом и нужными полями
  async getTripsOptimized(limit = 100, offset = 0) {
    const cacheKey = `trips-optimized-${limit}-${offset}`;
    
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          status,
          departure_date,
          arrival_date,
          point_a,
          point_b,
          contractor_id,
          driver_name,
          driver_phone,
          driver_license,
          vehicle_brand,
          vehicle_model,
          vehicle_license_plate,
          vehicle_capacity,
          cargo_description,
          cargo_weight,
          cargo_volume,
          cargo_value,
          comments,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Трансформируем данные в нужный формат
      const transformedData = data?.map(trip => ({
        id: trip.id,
        status: trip.status,
        departureDate: new Date(trip.departure_date),
        arrivalDate: trip.arrival_date ? new Date(trip.arrival_date) : undefined,
        pointA: trip.point_a,
        pointB: trip.point_b,
        contractorId: trip.contractor_id,
        driver: {
          name: trip.driver_name,
          phone: trip.driver_phone,
          license: trip.driver_license
        },
        vehicle: {
          brand: trip.vehicle_brand,
          model: trip.vehicle_model,
          licensePlate: trip.vehicle_license_plate,
          capacity: trip.vehicle_capacity
        },
        cargo: {
          description: trip.cargo_description,
          weight: trip.cargo_weight,
          volume: trip.cargo_volume,
          value: trip.cargo_value
        },
        comments: trip.comments,
        createdAt: new Date(trip.created_at)
      })) || [];

      globalCache.set(cacheKey, transformedData, 2 * 60 * 1000); // 2 минуты кэш
      return transformedData;
    } catch (error) {
      console.error('Failed to get trips optimized:', error);
      throw error;
    }
  }

  // Оптимизированная статистика дашборда с одним запросом
  async getDashboardStatsOptimized() {
    const cacheKey = 'dashboard-stats-optimized';
    
    const cached = globalCache.get(cacheKey);
    if (cached) return cached;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Один запрос для получения всех данных
      const [
        { data: trips, error: tripsError },
        { data: contractors, error: contractorsError },
        { data: drivers, error: driversError },
        { data: vehicles, error: vehiclesError },
        { data: expenses, error: expensesError }
      ] = await Promise.all([
        supabase.from('trips').select('id, status, cargo_value, cargo_weight, cargo_volume, created_at').eq('user_id', user.data.user.id),
        supabase.from('contractors').select('id').eq('user_id', user.data.user.id),
        supabase.from('drivers').select('id').eq('user_id', user.data.user.id),
        supabase.from('vehicles').select('id').eq('user_id', user.data.user.id),
        supabase.from('trip_expenses').select('amount, expense_date').eq('user_id', user.data.user.id)
      ]);

      if (tripsError || contractorsError || driversError || vehiclesError || expensesError) {
        throw new Error('Failed to fetch dashboard data');
      }

      // Быстрые вычисления
      const activeTrips = trips?.filter(t => t.status === 'in_progress').length || 0;
      const totalTrips = trips?.length || 0;
      const completedTrips = trips?.filter(t => t.status === 'completed').length || 0;
      const plannedTrips = trips?.filter(t => t.status === 'planned').length || 0;
      const cancelledTrips = trips?.filter(t => t.status === 'cancelled').length || 0;

      const totalCargoValue = trips?.reduce((sum, t) => sum + (t.cargo_value || 0), 0) || 0;
      const completedCargoValue = trips?.filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.cargo_value || 0), 0) || 0;
      
      const totalWeight = trips?.reduce((sum, t) => sum + (t.cargo_weight || 0), 0) || 0;
      const totalVolume = trips?.reduce((sum, t) => sum + (t.cargo_volume || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // Генерируем месячную статистику
      const monthlyStats = this.generateMonthlyStatsOptimized(trips || [], expenses || []);

      const result = {
        activeTrips,
        totalTrips,
        completedTrips,
        plannedTrips,
        cancelledTrips,
        contractors: contractors?.length || 0,
        drivers: drivers?.length || 0,
        vehicles: vehicles?.length || 0,
        totalCargoValue,
        completedCargoValue,
        totalWeight,
        totalVolume,
        monthlyStats,
        averageCargoValue: completedTrips > 0 ? completedCargoValue / completedTrips : 0,
        completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
        totalExpenses,
        profit: completedCargoValue - totalExpenses,
        profitMargin: completedCargoValue > 0 ? ((completedCargoValue - totalExpenses) / completedCargoValue) * 100 : 0
      };

      globalCache.set(cacheKey, result, 3 * 60 * 1000); // 3 минуты кэш
      return result;
    } catch (error) {
      console.error('Failed to get dashboard stats optimized:', error);
      throw error;
    }
  }

  private generateMonthlyStatsOptimized(trips: any[], expenses: any[]) {
    const monthNames = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Ноя', 'Дек'];
    const currentDate = new Date();
    const stats = [];

    // Группируем данные по месяцам заранее
    const tripsByMonth = new Map();
    const expensesByMonth = new Map();

    trips.forEach(trip => {
      const date = new Date(trip.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!tripsByMonth.has(key)) {
        tripsByMonth.set(key, []);
      }
      tripsByMonth.get(key).push(trip);
    });

    expenses.forEach(expense => {
      const date = new Date(expense.expense_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!expensesByMonth.has(key)) {
        expensesByMonth.set(key, []);
      }
      expensesByMonth.get(key).push(expense);
    });

    // Генерируем статистику для последних 6 месяцев
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      
      const monthTrips = tripsByMonth.get(key) || [];
      const monthExpenses = expensesByMonth.get(key) || [];

      stats.push({
        month: monthName,
        trips: monthTrips.length,
        revenue: monthTrips.reduce((sum, t) => sum + (t.cargo_value || 0), 0),
        weight: Math.round(monthTrips.reduce((sum, t) => sum + (t.cargo_weight || 0), 0) / 1000),
        expenses: monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      });
    }

    return stats;
  }

  // Инвалидация кэша
  invalidateCache(pattern?: string) {
    if (pattern) {
      // В будущем можно добавить более сложную логику
      globalCache.clear();
    } else {
      globalCache.clear();
    }
  }
}

export const optimizedSupabaseService = new OptimizedSupabaseService();
