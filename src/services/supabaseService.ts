
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
      expenseType: dbExpense.expense_type,
      amount: dbExpense.amount,
      description: dbExpense.description,
      expenseDate: new Date(dbExpense.expense_date),
      receiptUrl: dbExpense.receipt_url,
      createdAt: new Date(dbExpense.created_at),
      updatedAt: new Date(dbExpense.updated_at),
      userId: dbExpense.user_id
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
    return data.map(contractor => this.transformContractor(contractor));
  }

  async saveContractor(contractor: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Transform camelCase to snake_case for database
    const dbContractor = {
      company_name: contractor.companyName,
      inn: contractor.inn,
      address: contractor.address,
      notes: contractor.notes,
      user_id: user.id
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
    return data.map(driver => this.transformDriver(driver));
  }

  async saveDriver(driver: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const dbDriver = {
      name: driver.name,
      phone: driver.phone,
      license: driver.license,
      passport_data: driver.passportData,
      experience_years: driver.experienceYears,
      notes: driver.notes,
      user_id: user.id
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
    return data.map(vehicle => this.transformVehicle(vehicle));
  }

  async saveVehicle(vehicle: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

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
      notes: vehicle.notes,
      user_id: user.id
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
    return data.map(route => this.transformRoute(route));
  }

  async saveRoute(route: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const dbRoute = {
      name: route.name,
      point_a: route.pointA,
      point_b: route.pointB,
      distance_km: route.distanceKm,
      estimated_duration_hours: route.estimatedDurationHours,
      notes: route.notes,
      user_id: user.id
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
    return data.map(cargoType => this.transformCargoType(cargoType));
  }

  async saveCargoType(cargoType: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const dbCargoType = {
      name: cargoType.name,
      description: cargoType.description,
      default_weight: cargoType.defaultWeight,
      default_volume: cargoType.defaultVolume,
      hazardous: cargoType.hazardous,
      temperature_controlled: cargoType.temperatureControlled,
      fragile: cargoType.fragile,
      user_id: user.id
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
    return data.map(trip => this.transformTrip(trip));
  }

  async saveTrip(trip: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

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
      documents: trip.documents,
      user_id: user.id
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
    return data.map(expense => this.transformTripExpense(expense));
  }

  async createTripExpense(expense: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const dbExpense = {
      trip_id: expense.tripId,
      expense_type: expense.expenseType,
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expenseDate,
      receipt_url: expense.receiptUrl,
      user_id: user.id
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
    const dbExpense = {
      expense_type: expense.expenseType,
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expenseDate,
      receipt_url: expense.receiptUrl
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
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Получаем реальные данные из базы
      const [
        { data: trips, error: tripsError },
        { data: contractors, error: contractorsError },
        { data: drivers, error: driversError },
        { data: vehicles, error: vehiclesError },
        { data: tripExpenses, error: expensesError }
      ] = await Promise.all([
        supabase.from('trips').select('*').eq('user_id', user.id),
        supabase.from('contractors').select('*').eq('user_id', user.id),
        supabase.from('drivers').select('*').eq('user_id', user.id),
        supabase.from('vehicles').select('*').eq('user_id', user.id),
        supabase.from('trip_expenses').select('*').eq('user_id', user.id)
      ]);

      if (tripsError) throw tripsError;
      if (contractorsError) throw contractorsError;
      if (driversError) throw driversError;
      if (vehiclesError) throw vehiclesError;
      if (expensesError) throw expensesError;

      // Вычисляем статистику на основе реальных данных
      const activeTrips = trips?.filter(trip => trip.status === 'in_progress').length || 0;
      const totalTrips = trips?.length || 0;
      const completedTrips = trips?.filter(trip => trip.status === 'completed').length || 0;
      const plannedTrips = trips?.filter(trip => trip.status === 'planned').length || 0;
      const cancelledTrips = trips?.filter(trip => trip.status === 'cancelled').length || 0;

      // Вычисляем общую стоимость грузов
      const totalCargoValue = trips?.reduce((sum, trip) => sum + (trip.cargo_value || 0), 0) || 0;
      const completedCargoValue = trips?.filter(trip => trip.status === 'completed')
        .reduce((sum, trip) => sum + (trip.cargo_value || 0), 0) || 0;

      // Вычисляем общий вес и объем
      const totalWeight = trips?.reduce((sum, trip) => sum + (trip.cargo_weight || 0), 0) || 0;
      const totalVolume = trips?.reduce((sum, trip) => sum + (trip.cargo_volume || 0), 0) || 0;

      // Вычисляем общие расходы
      const totalExpenses = tripExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

      // Генерируем статистику по месяцам на основе реальных данных
      const monthlyStats = this.generateMonthlyStats(trips || [], tripExpenses || []);

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
        contractors: contractors?.length || 0,
        drivers: drivers?.length || 0,
        vehicles: vehicles?.length || 0,
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

      // Фильтруем расходы по месяцу
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
      });

      const tripsCount = monthTrips.length;
      const revenue = monthTrips.reduce((sum, trip) => sum + (trip.cargo_value || 0), 0);
      const weight = monthTrips.reduce((sum, trip) => sum + (trip.cargo_weight || 0), 0);
      const expensesTotal = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

      stats.push({
        month: monthName,
        trips: tripsCount,
        revenue,
        weight: Math.round(weight / 1000), // Конвертируем в тонны
        expenses: expensesTotal
      });
    }

    return stats;
  }

  async getAdvancedStats(filters: any = {}) {
    try {
      console.log('Getting advanced stats with filters:', filters);
      
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      // Строим запрос с фильтрами
      let tripsQuery = supabase
        .from('trips')
        .select(`
          *,
          trip_expenses(*)
        `)
        .eq('user_id', user.id);

      // Применяем фильтры даты
      if (filters.dateRange?.from) {
        tripsQuery = tripsQuery.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        tripsQuery = tripsQuery.lte('created_at', filters.dateRange.to.toISOString());
      }

      // Применяем фильтр статуса
      if (filters.status && filters.status !== 'all') {
        tripsQuery = tripsQuery.eq('status', filters.status);
      }

      // Применяем фильтр контрагента
      if (filters.contractorId && filters.contractorId !== 'all') {
        tripsQuery = tripsQuery.eq('contractor_id', filters.contractorId);
      }

      // Применяем фильтр водителя
      if (filters.driverId && filters.driverId !== 'all') {
        tripsQuery = tripsQuery.eq('driver_id', filters.driverId);
      }

      const { data: trips, error } = await tripsQuery;

      if (error) {
        console.error('Error fetching filtered trips:', error);
        throw error;
      }

      console.log('Filtered trips data:', trips);

      // Получаем базовую статистику
      const basicStats = await this.getDashboardStats();

      // Вычисляем продвинутые метрики
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

      // Вычисляем расходы по типам
      const expensesByType: Record<string, number> = {};
      trips?.forEach(trip => {
        trip.trip_expenses?.forEach((expense: any) => {
          const type = expense.expense_type || 'other';
          expensesByType[type] = (expensesByType[type] || 0) + (expense.amount || 0);
        });
      });

      const totalRevenue = completedTrips.reduce((sum, trip) => sum + (trip.cargo_value || 0), 0);
      const profit = totalRevenue - completedTripsExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const averageExpensePerTrip = trips?.length ? totalExpenses / trips.length : 0;

      // Реальная статистика по маршрутам
      const routeStats: Record<string, { count: number; revenue: number }> = {};
      completedTrips.forEach(trip => {
        const route = `${trip.point_a} - ${trip.point_b}`;
        if (!routeStats[route]) {
          routeStats[route] = { count: 0, revenue: 0 };
        }
        routeStats[route].count++;
        routeStats[route].revenue += trip.cargo_value || 0;
      });

      const topRoutes = Object.entries(routeStats)
        .map(([route, stats]) => ({ route, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Реальная производительность водителей
      const driverStats: Record<string, { tripsCount: number; totalRevenue: number; totalExpenses: number; name: string }> = {};
      trips?.forEach(trip => {
        const driverId = trip.driver_id || 'unknown';
        const driverName = trip.driver_name || 'Неизвестный водитель';
        
        if (!driverStats[driverId]) {
          driverStats[driverId] = { tripsCount: 0, totalRevenue: 0, totalExpenses: 0, name: driverName };
        }
        
        driverStats[driverId].tripsCount++;
        if (trip.status === 'completed') {
          driverStats[driverId].totalRevenue += trip.cargo_value || 0;
        }
        
        const tripExpenses = trip.trip_expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0;
        driverStats[driverId].totalExpenses += tripExpenses;
      });

      const driverPerformance = Object.entries(driverStats)
        .map(([driverId, stats]) => ({
          driverId,
          driverName: stats.name,
          tripsCount: stats.tripsCount,
          totalRevenue: stats.totalRevenue,
          totalExpenses: stats.totalExpenses
        }))
        .sort((a, b) => b.tripsCount - a.tripsCount)
        .slice(0, 5);

      // Реальная утилизация транспорта
      const vehicleStats: Record<string, { tripsCount: number; totalRevenue: number; name: string }> = {};
      trips?.forEach(trip => {
        const vehicleId = trip.vehicle_id || 'unknown';
        const vehicleName = trip.vehicle_license_plate || 'Неизвестный транспорт';
        
        if (!vehicleStats[vehicleId]) {
          vehicleStats[vehicleId] = { tripsCount: 0, totalRevenue: 0, name: vehicleName };
        }
        
        vehicleStats[vehicleId].tripsCount++;
        if (trip.status === 'completed') {
          vehicleStats[vehicleId].totalRevenue += trip.cargo_value || 0;
        }
      });

      const vehicleUtilization = Object.entries(vehicleStats)
        .map(([vehicleId, stats]) => ({
          vehicleId,
          vehicleName: stats.name,
          tripsCount: stats.tripsCount,
          totalKm: stats.tripsCount * 500, // Примерное значение
          totalRevenue: stats.totalRevenue
        }))
        .sort((a, b) => b.tripsCount - a.tripsCount)
        .slice(0, 5);

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
