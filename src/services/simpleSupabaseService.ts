
import { supabase } from '@/integrations/supabase/client';

class SimpleSupabaseService {
  async getDashboardStats() {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const userId = user.data.user.id;

      // Простые запросы без оптимизации
      const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId);

      const { data: contractors } = await supabase
        .from('contractors')
        .select('id')
        .eq('user_id', userId);

      const { data: drivers } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId);

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('user_id', userId);

      const { data: expenses } = await supabase
        .from('trip_expenses')
        .select('amount, expense_date')
        .eq('user_id', userId);

      const tripsData = trips || [];
      const expensesData = expenses || [];

      const activeTrips = tripsData.filter(t => t.status === 'in_progress').length;
      const totalTrips = tripsData.length;
      const completedTrips = tripsData.filter(t => t.status === 'completed').length;
      const plannedTrips = tripsData.filter(t => t.status === 'planned').length;
      const cancelledTrips = tripsData.filter(t => t.status === 'cancelled').length;

      const totalCargoValue = tripsData.reduce((sum, t) => sum + (t.cargo_value || 0), 0);
      const completedCargoValue = tripsData
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.cargo_value || 0), 0);
      
      const totalWeight = tripsData.reduce((sum, t) => sum + (t.cargo_weight || 0), 0);
      const totalVolume = tripsData.reduce((sum, t) => sum + (t.cargo_volume || 0), 0);
      const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);

      // Простая генерация месячной статистики
      const monthlyStats = this.generateSimpleMonthlyStats(tripsData);

      return {
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
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  private generateSimpleMonthlyStats(trips: any[]) {
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

export const simpleSupabaseService = new SimpleSupabaseService();
