import { supabase } from '@/integrations/supabase/client';

class SupabaseService {
  // Expose supabase client for direct access
  get supabase() {
    return supabase;
  }

  // Data transformation helpers
  private transformContractor(dbContractor: any): any {
    return {
      id: dbContractor.id,
      companyName: dbContractor.company_name,
      inn: dbContractor.inn,
      address: dbContractor.address,
      contacts: dbContractor.contacts || [],
      notes: dbContractor.notes,
      createdAt: new Date(dbContractor.created_at),
      updatedAt: new Date(dbContractor.updated_at)
    };
  }

  private transformDriver(dbDriver: any): any {
    return {
      id: dbDriver.id,
      name: dbDriver.name,
      phone: dbDriver.phone,
      license: dbDriver.license,
      passportData: dbDriver.passport_data,
      experienceYears: dbDriver.experience_years,
      notes: dbDriver.notes,
      createdAt: new Date(dbDriver.created_at),
      updatedAt: new Date(dbDriver.updated_at)
    };
  }

  private transformVehicle(dbVehicle: any): any {
    return {
      id: dbVehicle.id,
      brand: dbVehicle.brand,
      model: dbVehicle.model,
      licensePlate: dbVehicle.license_plate,
      capacity: dbVehicle.capacity,
      year: dbVehicle.year,
      vin: dbVehicle.vin,
      registrationCertificate: dbVehicle.registration_certificate,
      insurancePolicy: dbVehicle.insurance_policy,
      insuranceExpiry: dbVehicle.insurance_expiry ? new Date(dbVehicle.insurance_expiry) : undefined,
      technicalInspectionExpiry: dbVehicle.technical_inspection_expiry ? new Date(dbVehicle.technical_inspection_expiry) : undefined,
      notes: dbVehicle.notes,
      createdAt: new Date(dbVehicle.created_at),
      updatedAt: new Date(dbVehicle.updated_at)
    };
  }

  private transformRoute(dbRoute: any): any {
    return {
      id: dbRoute.id,
      name: dbRoute.name,
      pointA: dbRoute.point_a,
      pointB: dbRoute.point_b,
      distanceKm: dbRoute.distance_km,
      estimatedDurationHours: dbRoute.estimated_duration_hours,
      notes: dbRoute.notes,
      createdAt: new Date(dbRoute.created_at),
      updatedAt: new Date(dbRoute.updated_at)
    };
  }

  private transformCargoType(dbCargoType: any): any {
    return {
      id: dbCargoType.id,
      name: dbCargoType.name,
      description: dbCargoType.description,
      defaultWeight: dbCargoType.default_weight,
      defaultVolume: dbCargoType.default_volume,
      hazardous: dbCargoType.hazardous,
      temperatureControlled: dbCargoType.temperature_controlled,
      fragile: dbCargoType.fragile,
      createdAt: new Date(dbCargoType.created_at),
      updatedAt: new Date(dbCargoType.updated_at)
    };
  }

  private transformTrip(dbTrip: any): any {
    return {
      id: dbTrip.id,
      status: dbTrip.status,
      departureDate: new Date(dbTrip.departure_date),
      arrivalDate: dbTrip.arrival_date ? new Date(dbTrip.arrival_date) : undefined,
      pointA: dbTrip.point_a,
      pointB: dbTrip.point_b,
      contractorId: dbTrip.contractor_id,
      driverId: dbTrip.driver_id,
      vehicleId: dbTrip.vehicle_id,
      routeId: dbTrip.route_id,
      cargoTypeId: dbTrip.cargo_type_id,
      driver: {
        name: dbTrip.driver_name,
        phone: dbTrip.driver_phone,
        license: dbTrip.driver_license
      },
      vehicle: {
        brand: dbTrip.vehicle_brand,
        model: dbTrip.vehicle_model,
        licensePlate: dbTrip.vehicle_license_plate,
        capacity: dbTrip.vehicle_capacity
      },
      cargo: {
        description: dbTrip.cargo_description,
        weight: dbTrip.cargo_weight,
        volume: dbTrip.cargo_volume,
        value: dbTrip.cargo_value
      },
      comments: dbTrip.comments,
      documents: dbTrip.documents || [],
      createdAt: new Date(dbTrip.created_at),
      updatedAt: new Date(dbTrip.updated_at),
      changeLog: []
    };
  }

  private transformTripExpense(dbExpense: any): any {
    return {
      id: dbExpense.id,
      tripId: dbExpense.trip_id,
      category: dbExpense.category,
      amount: dbExpense.amount,
      description: dbExpense.description,
      date: new Date(dbExpense.date),
      createdAt: new Date(dbExpense.created_at),
      updatedAt: new Date(dbExpense.updated_at),
      createdBy: dbExpense.created_by
    };
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
      .select(`
        *,
        contacts(*)
      `);
    if (error) throw error;
    return (data || []).map((contractor: any) => this.transformContractor(contractor));
  }

  async saveContractor(contractor: any) {
    const dbContractor = {
      company_name: contractor.companyName,
      inn: contractor.inn,
      address: contractor.address,
      notes: contractor.notes
    };

    if (contractor.id) {
      const { data, error } = await supabase
        .from('contractors')
        .update(dbContractor)
        .eq('id', contractor.id)
        .select()
        .single();
      if (error) throw error;
      return this.transformContractor(data);
    } else {
      const { data, error } = await supabase
        .from('contractors')
        .insert(dbContractor)
        .select()
        .single();
      if (error) throw error;
      return this.transformContractor(data);
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
    return (data || []).map((driver: any) => this.transformDriver(driver));
  }

  async saveDriver(driver: any) {
    const dbDriver = {
      name: driver.name,
      phone: driver.phone,
      license: driver.license,
      passport_data: driver.passportData,
      experience_years: driver.experienceYears,
      notes: driver.notes
    };

    if (driver.id) {
      const { data, error } = await supabase
        .from('drivers')
        .update(dbDriver)
        .eq('id', driver.id)
        .select()
        .single();
      if (error) throw error;
      return this.transformDriver(data);
    } else {
      const { data, error } = await supabase
        .from('drivers')
        .insert(dbDriver)
        .select()
        .single();
      if (error) throw error;
      return this.transformDriver(data);
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
    return (data || []).map((vehicle: any) => this.transformVehicle(vehicle));
  }

  async saveVehicle(vehicle: any) {
    const dbVehicle = {
      brand: vehicle.brand,
      model: vehicle.model,
      license_plate: vehicle.licensePlate,
      capacity: vehicle.capacity,
      year: vehicle.year,
      vin: vehicle.vin,
      registration_certificate: vehicle.registrationCertificate,
      insurance_policy: vehicle.insurancePolicy,
      insurance_expiry: vehicle.insuranceExpiry,
      technical_inspection_expiry: vehicle.technicalInspectionExpiry,
      notes: vehicle.notes
    };

    if (vehicle.id) {
      const { data, error } = await supabase
        .from('vehicles')
        .update(dbVehicle)
        .eq('id', vehicle.id)
        .select()
        .single();
      if (error) throw error;
      return this.transformVehicle(data);
    } else {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(dbVehicle)
        .select()
        .single();
      if (error) throw error;
      return this.transformVehicle(data);
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
    return (data || []).map((route: any) => this.transformRoute(route));
  }

  async saveRoute(route: any) {
    const dbRoute = {
      name: route.name,
      point_a: route.pointA,
      point_b: route.pointB,
      distance_km: route.distanceKm,
      estimated_duration_hours: route.estimatedDurationHours,
      notes: route.notes
    };

    if (route.id) {
      const { data, error } = await supabase
        .from('routes')
        .update(dbRoute)
        .eq('id', route.id)
        .select()
        .single();
      if (error) throw error;
      return this.transformRoute(data);
    } else {
      const { data, error } = await supabase
        .from('routes')
        .insert(dbRoute)
        .select()
        .single();
      if (error) throw error;
      return this.transformRoute(data);
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
    return (data || []).map((cargoType: any) => this.transformCargoType(cargoType));
  }

  async saveCargoType(cargoType: any) {
    const dbCargoType = {
      name: cargoType.name,
      description: cargoType.description,
      default_weight: cargoType.defaultWeight,
      default_volume: cargoType.defaultVolume,
      hazardous: cargoType.hazardous,
      temperature_controlled: cargoType.temperatureControlled,
      fragile: cargoType.fragile
    };

    if (cargoType.id) {
      const { data, error } = await supabase
        .from('cargo_types')
        .update(dbCargoType)
        .eq('id', cargoType.id)
        .select()
        .single();
      if (error) throw error;
      return this.transformCargoType(data);
    } else {
      const { data, error } = await supabase
        .from('cargo_types')
        .insert(dbCargoType)
        .select()
        .single();
      if (error) throw error;
      return this.transformCargoType(data);
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
    return (data || []).map((trip: any) => this.transformTrip(trip));
  }

  async saveTrip(trip: any) {
    const dbTrip = {
      status: trip.status,
      departure_date: trip.departureDate,
      arrival_date: trip.arrivalDate,
      point_a: trip.pointA,
      point_b: trip.pointB,
      contractor_id: trip.contractorId,
      driver_id: trip.driverId,
      vehicle_id: trip.vehicleId,
      route_id: trip.routeId,
      cargo_type_id: trip.cargoTypeId,
      driver_name: trip.driver?.name,
      driver_phone: trip.driver?.phone,
      driver_license: trip.driver?.license,
      vehicle_brand: trip.vehicle?.brand,
      vehicle_model: trip.vehicle?.model,
      vehicle_license_plate: trip.vehicle?.licensePlate,
      vehicle_capacity: trip.vehicle?.capacity,
      cargo_description: trip.cargo?.description,
      cargo_weight: trip.cargo?.weight,
      cargo_volume: trip.cargo?.volume,
      cargo_value: trip.cargo?.value,
      comments: trip.comments,
      documents: trip.documents
    };

    if (trip.id) {
      const { data, error } = await supabase
        .from('trips')
        .update(dbTrip)
        .eq('id', trip.id)
        .select()
        .single();
      if (error) throw error;
      return this.transformTrip(data);
    } else {
      const { data, error } = await supabase
        .from('trips')
        .insert(dbTrip)
        .select()
        .single();
      if (error) throw error;
      return this.transformTrip(data);
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
    return (data || []).map((expense: any) => this.transformTripExpense(expense));
  }

  async createTripExpense(expense: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use correct column names: category instead of expense_type, date instead of expense_date
    const dbExpense = {
      trip_id: expense.tripId,
      category: expense.category || expense.expenseType,
      amount: expense.amount,
      description: expense.description,
      date: expense.date || expense.expenseDate,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('trip_expenses')
      .insert(dbExpense)
      .select()
      .single();
    if (error) throw error;
    return this.transformTripExpense(data);
  }

  async updateTripExpense(id: string, expense: any) {
    // Use correct column names
    const dbExpense = {
      category: expense.category || expense.expenseType,
      amount: expense.amount,
      description: expense.description,
      date: expense.date || expense.expenseDate
    };

    const { data, error } = await supabase
      .from('trip_expenses')
      .update(dbExpense)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.transformTripExpense(data);
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
      // Use RLS-protected queries (no user_id filter needed as RLS handles it)
      const [tripsResult, contractorsResult, driversResult, vehiclesResult, expensesResult] = await Promise.all([
        supabase.from('trips').select('*'),
        supabase.from('contractors').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('trip_expenses').select('*')
      ]);

      const trips = tripsResult.data || [];
      const contractors = contractorsResult.data || [];
      const drivers = driversResult.data || [];
      const vehicles = vehiclesResult.data || [];
      const tripExpenses = expensesResult.data || [];

      // Вычисляем статистику на основе реальных данных
      const activeTrips = trips.filter((trip: any) => trip.status === 'in_progress').length;
      const totalTrips = trips.length;
      const completedTrips = trips.filter((trip: any) => trip.status === 'completed').length;
      const plannedTrips = trips.filter((trip: any) => trip.status === 'planned').length;
      const cancelledTrips = trips.filter((trip: any) => trip.status === 'cancelled').length;

      // Вычисляем общую стоимость грузов
      const totalCargoValue = trips.reduce((sum: number, trip: any) => sum + (trip.cargo_value || 0), 0);
      const completedCargoValue = trips
        .filter((trip: any) => trip.status === 'completed')
        .reduce((sum: number, trip: any) => sum + (trip.cargo_value || 0), 0);

      // Вычисляем общий вес и объем
      const totalWeight = trips.reduce((sum: number, trip: any) => sum + (trip.cargo_weight || 0), 0);
      const totalVolume = trips.reduce((sum: number, trip: any) => sum + (trip.cargo_volume || 0), 0);

      // Вычисляем общие расходы
      const totalExpenses = tripExpenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);

      // Генерируем статистику по месяцам на основе реальных данных
      const monthlyStats = this.generateMonthlyStats(trips, tripExpenses);

      const averageCargoValue = completedTrips > 0 ? completedCargoValue / completedTrips : 0;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;
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

  private generateMonthlyStats(trips: any[], expenses: any[]) {
    const monthNames = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Ноя', 'Дек'];
    const currentDate = new Date();
    const stats = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      
      // Фильтруем рейсы по месяцу
      const monthTrips = trips.filter(trip => {
        const tripDate = new Date(trip.created_at);
        return tripDate.getMonth() === date.getMonth() && tripDate.getFullYear() === date.getFullYear();
      });

      // Фильтруем расходы по месяцу (use 'date' column)
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
      });

      const tripsCount = monthTrips.length;
      const revenue = monthTrips.reduce((sum: number, trip: any) => sum + (trip.cargo_value || 0), 0);
      const weight = monthTrips.reduce((sum: number, trip: any) => sum + (trip.cargo_weight || 0), 0);
      const expensesTotal = monthExpenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);

      stats.push({
        month: monthName,
        trips: tripsCount,
        revenue,
        weight: Math.round(weight / 1000),
        expenses: expensesTotal
      });
    }

    return stats;
  }

  async getAdvancedStats(filters: any = {}) {
    try {
      console.log('Getting advanced stats with filters:', filters);
      
      // Get date range from filters
      const startDate = filters.dateRange?.from?.toISOString();
      const endDate = filters.dateRange?.to?.toISOString();
      
      // Build trips query with filters
      let tripsQuery = supabase
        .from('trips')
        .select(`
          *,
          trip_expenses(*)
        `);

      if (startDate) {
        tripsQuery = tripsQuery.gte('departure_date', startDate);
      }
      if (endDate) {
        tripsQuery = tripsQuery.lte('departure_date', endDate);
      }
      if (filters.status && filters.status !== 'all') {
        tripsQuery = tripsQuery.eq('status', filters.status);
      }

      const [
        { data: trips, error: tripsError },
        { data: contractors },
        { data: drivers },
        { data: vehicles }
      ] = await Promise.all([
        tripsQuery,
        supabase.from('contractors').select('id'),
        supabase.from('drivers').select('id'),
        supabase.from('vehicles').select('id')
      ]);
      
      if (tripsError) throw tripsError;

      // Calculate stats by status
      const activeTrips = trips?.filter(t => t.status === 'in_progress').length || 0;
      const completedTrips = trips?.filter(t => t.status === 'completed').length || 0;
      const plannedTrips = trips?.filter(t => t.status === 'planned').length || 0;
      const cancelledTrips = trips?.filter(t => t.status === 'cancelled').length || 0;
      const totalTrips = trips?.length || 0;

      // Calculate cargo values
      const totalCargoValue = trips?.reduce((sum, t) => sum + (t.cargo_value || 0), 0) || 0;
      const completedCargoValue = trips?.filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.cargo_value || 0), 0) || 0;
      const totalWeight = trips?.reduce((sum, t) => sum + (t.cargo_weight || 0), 0) || 0;
      const totalVolume = trips?.reduce((sum, t) => sum + (t.cargo_volume || 0), 0) || 0;
      const averageCargoValue = totalTrips > 0 ? totalCargoValue / totalTrips : 0;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

      // Calculate expenses
      const allExpenses = trips?.flatMap(t => t.trip_expenses || []) || [];
      const totalExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const completedTripsExpenses = trips?.filter(t => t.status === 'completed')
        .flatMap(t => t.trip_expenses || [])
        .reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      
      const expensesByType: Record<string, number> = {};
      allExpenses.forEach(e => {
        const category = e.category || 'Прочее';
        expensesByType[category] = (expensesByType[category] || 0) + (e.amount || 0);
      });

      const profit = totalCargoValue - totalExpenses;
      const profitMargin = totalCargoValue > 0 ? (profit / totalCargoValue) * 100 : 0;
      const averageExpensePerTrip = totalTrips > 0 ? totalExpenses / totalTrips : 0;

      // Top routes
      const routeStats: Record<string, { count: number; revenue: number }> = {};
      trips?.forEach(trip => {
        const route = `${trip.point_a} → ${trip.point_b}`;
        if (!routeStats[route]) {
          routeStats[route] = { count: 0, revenue: 0 };
        }
        routeStats[route].count++;
        routeStats[route].revenue += trip.cargo_value || 0;
      });

      const topRoutes = Object.entries(routeStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([route, stats]) => ({ route, count: stats.count, revenue: stats.revenue }));

      // Driver performance
      const driverStatsMap: Record<string, { id: string; name: string; trips: number; revenue: number; expenses: number }> = {};
      trips?.forEach(trip => {
        const driverId = trip.driver_id || 'unknown';
        const driverName = trip.driver_name || 'Неизвестный';
        if (!driverStatsMap[driverId]) {
          driverStatsMap[driverId] = { id: driverId, name: driverName, trips: 0, revenue: 0, expenses: 0 };
        }
        driverStatsMap[driverId].trips++;
        driverStatsMap[driverId].revenue += trip.cargo_value || 0;
        driverStatsMap[driverId].expenses += (trip.trip_expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
      });

      const driverPerformance = Object.values(driverStatsMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(d => ({
          driverId: d.id,
          driverName: d.name,
          tripsCount: d.trips,
          totalRevenue: d.revenue,
          totalExpenses: d.expenses
        }));

      // Vehicle utilization
      const vehicleStatsMap: Record<string, { id: string; name: string; trips: number; revenue: number }> = {};
      trips?.forEach(trip => {
        const vehicleId = trip.vehicle_id || 'unknown';
        const vehicleName = `${trip.vehicle_brand || ''} ${trip.vehicle_model || ''}`.trim() || 'Неизвестный';
        if (!vehicleStatsMap[vehicleId]) {
          vehicleStatsMap[vehicleId] = { id: vehicleId, name: vehicleName, trips: 0, revenue: 0 };
        }
        vehicleStatsMap[vehicleId].trips++;
        vehicleStatsMap[vehicleId].revenue += trip.cargo_value || 0;
      });

      const vehicleUtilization = Object.values(vehicleStatsMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(v => ({
          vehicleId: v.id,
          vehicleName: v.name,
          tripsCount: v.trips,
          totalKm: 0,
          totalRevenue: v.revenue
        }));

      // Monthly stats (last 6 months)
      const monthlyStats: Array<{ month: string; trips: number; revenue: number; weight: number; expenses: number }> = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthDate.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
        
        const monthTrips = trips?.filter(t => {
          const tripDate = new Date(t.departure_date);
          return tripDate >= monthDate && tripDate <= monthEnd;
        }) || [];

        monthlyStats.push({
          month: monthName,
          trips: monthTrips.length,
          revenue: monthTrips.reduce((s, t) => s + (t.cargo_value || 0), 0),
          weight: monthTrips.reduce((s, t) => s + (t.cargo_weight || 0), 0),
          expenses: monthTrips.flatMap(t => t.trip_expenses || []).reduce((s, e) => s + (e.amount || 0), 0)
        });
      }

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
        averageCargoValue,
        completionRate,
        totalExpenses,
        completedTripsExpenses,
        expensesByType,
        profit,
        profitMargin,
        averageExpensePerTrip,
        monthlyStats,
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

export const supabaseService = new SupabaseService();
