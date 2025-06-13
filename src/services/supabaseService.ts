import { supabase } from '@/integrations/supabase/client';

interface Trip {
  id: string;
  created_at: string;
  status: string;
  contractor_id: string;
  driver_id: string;
  trip_expenses: TripExpense[];
}

interface TripExpense {
  id: string;
  trip_id: string;
  type: string;
  amount: number;
}

class SupabaseService {
  async getDashboardStats() {
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*');

      if (error) {
        console.error('Error fetching trips:', error);
        throw error;
      }

      const activeTrips = trips.filter(trip => trip.status === 'active').length;
      const totalTrips = trips.length;
      const completedTrips = trips.filter(trip => trip.status === 'completed').length;
      const plannedTrips = trips.filter(trip => trip.status === 'planned').length;
      const cancelledTrips = trips.filter(trip => trip.status === 'cancelled').length;

      const { data: contractors, error: contractorError } = await supabase
        .from('contractors')
        .select('*');

      if (contractorError) {
        console.error('Error fetching contractors:', contractorError);
        throw contractorError;
      }

      const { data: drivers, error: driverError } = await supabase
        .from('drivers')
        .select('*');

      if (driverError) {
        console.error('Error fetching drivers:', driverError);
        throw driverError;
      }

      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehicleError) {
        console.error('Error fetching vehicles:', vehicleError);
        throw vehicleError;
      }

      // Mock data for cargo value, weight, and volume
      const totalCargoValue = 5000000;
      const completedCargoValue = 3500000;
      const totalWeight = 15000;
      const totalVolume = 120;

      // Mock data for monthly stats
      const monthlyStats = [
        { month: 'Янв', revenue: 400000, weight: 1200 },
        { month: 'Фев', revenue: 450000, weight: 1350 },
        { month: 'Март', revenue: 600000, weight: 1800 },
        { month: 'Апр', revenue: 550000, weight: 1650 },
        { month: 'Май', revenue: 700000, weight: 2100 },
        { month: 'Июнь', revenue: 650000, weight: 1950 },
      ];

      const averageCargoValue = completedTrips > 0 ? completedCargoValue / completedTrips : 0;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;
      const totalExpenses = 1200000;
      const profit = completedCargoValue - totalExpenses;
      const profitMargin = completedCargoValue > 0 ? (profit / completedCargoValue) * 100 : 0;

      return {
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
        averageCargoValue,
        completionRate,
        totalExpenses,
        profit,
        profitMargin
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  async getAdvancedStats(filters: any = {}) {
    try {
      console.log('Getting advanced stats with filters:', filters);
      
      // Get basic stats first
      const basicStats = await this.getDashboardStats();
      
      // Build query with filters
      let query = supabase
        .from('trips')
        .select(`
          *,
          trip_expenses(*)
        `);

      // Apply date range filter
      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply contractor filter
      if (filters.contractorId && filters.contractorId !== 'all') {
        query = query.eq('contractor_id', filters.contractorId);
      }

      // Apply driver filter
      if (filters.driverId && filters.driverId !== 'all') {
        query = query.eq('driver_id', filters.driverId);
      }

      const { data: trips, error } = await query;

      if (error) {
        console.error('Error fetching filtered trips:', error);
        throw error;
      }

      console.log('Filtered trips data:', trips);

      // Calculate advanced metrics
      const totalExpenses = trips?.reduce((sum, trip) => {
        const tripExpenses = trip.trip_expenses?.reduce((expSum: number, exp: any) => 
          expSum + (exp.amount || 0), 0) || 0;
        return sum + tripExpenses;
      }, 0) || 0;

      const completedTrips = trips?.filter(trip => trip.status === 'completed') || [];
      const completedTripsExpenses = completedTrips.reduce((sum, trip) => {
        const tripExpenses = trip.trip_expenses?.reduce((expSum: number, exp: any) => 
          expSum + (exp.amount || 0), 0) || 0;
        return sum + tripExpenses;
      }, 0);

      // Calculate expenses by type
      const expensesByType: Record<string, number> = {};
      trips?.forEach(trip => {
        trip.trip_expenses?.forEach((expense: any) => {
          const type = expense.type || 'other';
          expensesByType[type] = (expensesByType[type] || 0) + (expense.amount || 0);
        });
      });

      const totalRevenue = basicStats.completedCargoValue;
      const profit = totalRevenue - completedTripsExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const averageExpensePerTrip = trips?.length ? totalExpenses / trips.length : 0;

      // Mock data for additional stats (would require more complex queries in real implementation)
      const topRoutes = [
        { route: 'Москва - СПб', count: 15, revenue: 1500000 },
        { route: 'СПб - Москва', count: 12, revenue: 1200000 },
        { route: 'Москва - Казань', count: 8, revenue: 800000 }
      ];

      const driverPerformance = [
        { name: 'Иванов И.И.', trips: 25, rating: 4.8, revenue: 2500000 },
        { name: 'Петров П.П.', trips: 20, rating: 4.6, revenue: 2000000 },
        { name: 'Сидоров С.С.', trips: 18, rating: 4.5, revenue: 1800000 }
      ];

      const vehicleUtilization = [
        { vehicle: 'А123БВ777', utilization: 85, trips: 22, revenue: 2200000 },
        { vehicle: 'В456ГД777', utilization: 78, trips: 18, revenue: 1800000 },
        { vehicle: 'Г789ЕЖ777', utilization: 72, trips: 15, revenue: 1500000 }
      ];

      return {
        ...basicStats,
        totalExpenses,
        completedTripsExpenses,
        expensesByType,
        profit,
        profitMargin,
        averageExpensePerTrip,
        topRoutes,
        driverPerformance,
        vehicleUtilization
      };
    } catch (error) {
      console.error('Error in getAdvancedStats:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
