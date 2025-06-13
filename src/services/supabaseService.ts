
import { supabase } from '@/integrations/supabase/client';
import { ExpenseType } from '@/types/expenses';

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
  // Expose supabase client for direct access
  get supabase() {
    return supabase;
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // CRUD methods for various entities
  async getContractors() {
    const { data, error } = await supabase
      .from('contractors')
      .select('*');
    if (error) throw error;
    return data;
  }

  async saveContractor(contractor: any) {
    if (contractor.id) {
      const { data, error } = await supabase
        .from('contractors')
        .update(contractor)
        .eq('id', contractor.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('contractors')
        .insert(contractor)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async deleteContractor(id: string) {
    const { error } = await supabase
      .from('contractors')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*');
    if (error) throw error;
    return data;
  }

  async saveDriver(driver: any) {
    if (driver.id) {
      const { data, error } = await supabase
        .from('drivers')
        .update(driver)
        .eq('id', driver.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driver)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async deleteDriver(id: string) {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
    if (error) throw error;
    return data;
  }

  async saveVehicle(vehicle: any) {
    if (vehicle.id) {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicle)
        .eq('id', vehicle.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async deleteVehicle(id: string) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select('*');
    if (error) throw error;
    return data;
  }

  async saveRoute(route: any) {
    if (route.id) {
      const { data, error } = await supabase
        .from('routes')
        .update(route)
        .eq('id', route.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('routes')
        .insert(route)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async deleteRoute(id: string) {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getCargoTypes() {
    const { data, error } = await supabase
      .from('cargo_types')
      .select('*');
    if (error) throw error;
    return data;
  }

  async saveCargoType(cargoType: any) {
    if (cargoType.id) {
      const { data, error } = await supabase
        .from('cargo_types')
        .update(cargoType)
        .eq('id', cargoType.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('cargo_types')
        .insert(cargoType)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async deleteCargoType(id: string) {
    const { error } = await supabase
      .from('cargo_types')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select('*');
    if (error) throw error;
    return data;
  }

  async saveTrip(trip: any) {
    if (trip.id) {
      const { data, error } = await supabase
        .from('trips')
        .update(trip)
        .eq('id', trip.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async deleteTrip(id: string) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getTripExpenses(tripId: string) {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId);
    if (error) throw error;
    return data;
  }

  async createTripExpense(expense: any) {
    const { data, error } = await supabase
      .from('trip_expenses')
      .insert(expense)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateTripExpense(id: string, expense: any) {
    const { data, error } = await supabase
      .from('trip_expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTripExpense(id: string) {
    const { error } = await supabase
      .from('trip_expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

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

      // Mock data for monthly stats with proper structure
      const monthlyStats = [
        { month: 'Янв', trips: 25, revenue: 400000, weight: 1200, expenses: 120000 },
        { month: 'Фев', trips: 30, revenue: 450000, weight: 1350, expenses: 135000 },
        { month: 'Март', trips: 40, revenue: 600000, weight: 1800, expenses: 180000 },
        { month: 'Апр', trips: 35, revenue: 550000, weight: 1650, expenses: 165000 },
        { month: 'Май', trips: 45, revenue: 700000, weight: 2100, expenses: 210000 },
        { month: 'Июнь', trips: 42, revenue: 650000, weight: 1950, expenses: 195000 },
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
          const type = expense.expense_type || 'other';
          expensesByType[type] = (expensesByType[type] || 0) + (expense.amount || 0);
        });
      });

      const totalRevenue = basicStats.completedCargoValue;
      const profit = totalRevenue - completedTripsExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const averageExpensePerTrip = trips?.length ? totalExpenses / trips.length : 0;

      // Mock data for additional stats
      const topRoutes = [
        { route: 'Москва - СПб', count: 15, revenue: 1500000 },
        { route: 'СПб - Москва', count: 12, revenue: 1200000 },
        { route: 'Москва - Казань', count: 8, revenue: 800000 }
      ];

      const driverPerformance = [
        { driverId: '1', driverName: 'Иванов И.И.', tripsCount: 25, totalRevenue: 2500000, totalExpenses: 250000 },
        { driverId: '2', driverName: 'Петров П.П.', tripsCount: 20, totalRevenue: 2000000, totalExpenses: 200000 },
        { driverId: '3', driverName: 'Сидоров С.С.', tripsCount: 18, totalRevenue: 1800000, totalExpenses: 180000 }
      ];

      const vehicleUtilization = [
        { vehicleId: '1', vehicleName: 'А123БВ777', tripsCount: 22, totalKm: 15000, totalRevenue: 2200000 },
        { vehicleId: '2', vehicleName: 'В456ГД777', tripsCount: 18, totalKm: 12000, totalRevenue: 1800000 },
        { vehicleId: '3', vehicleName: 'Г789ЕЖ777', tripsCount: 15, totalKm: 10000, totalRevenue: 1500000 }
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
