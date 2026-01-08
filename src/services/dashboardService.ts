import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
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

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching dashboard data for user:', user.data.user.id);

      // Простые запросы без сложной оптимизации
      const [tripsResult, contractorsResult, driversResult, vehiclesResult, expensesResult] = await Promise.all([
        supabase.from('trips').select('*'),
        supabase.from('contractors').select('id'),
        supabase.from('drivers').select('id'),
        supabase.from('vehicles').select('id'),
        supabase.from('trip_expenses').select('amount, date')
      ]);

      const trips = tripsResult.data || [];
      const contractors = contractorsResult.data || [];
      const drivers = driversResult.data || [];
      const vehicles = vehiclesResult.data || [];
      const expenses = expensesResult.data || [];

      console.log('Fetched data:', { trips: trips.length, contractors: contractors.length, drivers: drivers.length, vehicles: vehicles.length, expenses: expenses.length });

      // Подсчет статистики
      const activeTrips = trips.filter(t => t.status === 'in_progress').length;
      const totalTrips = trips.length;
      const completedTrips = trips.filter(t => t.status === 'completed').length;
      const plannedTrips = trips.filter(t => t.status === 'planned').length;
      const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;

      const totalCargoValue = trips.reduce((sum, t) => sum + (t.cargo_value || 0), 0);
      const completedCargoValue = trips
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.cargo_value || 0), 0);
      
      const totalWeight = trips.reduce((sum, t) => sum + (t.cargo_weight || 0), 0);
      const totalVolume = trips.reduce((sum, t) => sum + (t.cargo_volume || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Простая месячная статистика
      const monthlyStats = this.generateMonthlyStats(trips);

      const result = {
        activeTrips,
        totalTrips,
        completedTrips,
        plannedTrips,
        cancelledTrips,
        contractors: contractors.length,
        drivers: drivers.length,
        vehicles: vehicles.length,
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

      console.log('Dashboard stats calculated:', result);
      return result;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  private generateMonthlyStats(trips: any[]) {
    const monthNames = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Ноя', 'Дек'];
    const stats = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = monthNames[date.getMonth()];
      
      const monthTrips = trips.filter(trip => {
        const tripDate = new Date(trip.created_at);
        return tripDate.getMonth() === date.getMonth() && 
               tripDate.getFullYear() === date.getFullYear();
      });

      stats.push({
        month: monthName,
        trips: monthTrips.length,
        revenue: monthTrips.reduce((sum, t) => sum + (t.cargo_value || 0), 0),
        weight: Math.round(monthTrips.reduce((sum, t) => sum + (t.cargo_weight || 0), 0) / 1000)
      });
    }

    return stats;
  }
}

export const dashboardService = new DashboardService();
