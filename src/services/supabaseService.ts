import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Contractor, Driver, Vehicle, CargoType, Route, Trip, TripExpense } from '@/types';

export class SupabaseService {
  public supabase = supabase;

  // Data transformation helpers
  private transformContractor(data: any): Contractor {
    return {
      id: data.id,
      companyName: data.company_name,
      inn: data.inn,
      address: data.address,
      notes: data.notes,
      contacts: data.contacts ? data.contacts.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        position: contact.position
      })) : [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private transformDriver(data: any): Driver {
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      license: data.license,
      passportData: data.passport_data,
      experienceYears: data.experience_years,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private transformVehicle(data: any): Vehicle {
    return {
      id: data.id,
      brand: data.brand,
      model: data.model,
      licensePlate: data.license_plate,
      capacity: data.capacity,
      year: data.year,
      vin: data.vin,
      registrationCertificate: data.registration_certificate,
      insurancePolicy: data.insurance_policy,
      insuranceExpiry: data.insurance_expiry ? new Date(data.insurance_expiry) : undefined,
      technicalInspectionExpiry: data.technical_inspection_expiry ? new Date(data.technical_inspection_expiry) : undefined,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private transformCargoType(data: any): CargoType {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      defaultWeight: data.default_weight,
      defaultVolume: data.default_volume,
      hazardous: data.hazardous,
      temperatureControlled: data.temperature_controlled,
      fragile: data.fragile,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private transformRoute(data: any): Route {
    return {
      id: data.id,
      name: data.name,
      pointA: data.point_a,
      pointB: data.point_b,
      distanceKm: data.distance_km,
      estimatedDurationHours: data.estimated_duration_hours,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private transformTrip(data: any): Trip {
    return {
      id: data.id,
      status: data.status,
      departureDate: new Date(data.departure_date),
      arrivalDate: data.arrival_date ? new Date(data.arrival_date) : undefined,
      pointA: data.point_a,
      pointB: data.point_b,
      contractorId: data.contractor_id,
      driverId: data.driver_id,
      vehicleId: data.vehicle_id,
      routeId: data.route_id,
      cargoTypeId: data.cargo_type_id,
      driver: {
        name: data.driver_name,
        phone: data.driver_phone,
        license: data.driver_license
      },
      vehicle: {
        brand: data.vehicle_brand,
        model: data.vehicle_model,
        licensePlate: data.vehicle_license_plate,
        capacity: data.vehicle_capacity
      },
      cargo: {
        description: data.cargo_description,
        weight: data.cargo_weight,
        volume: data.cargo_volume,
        value: data.cargo_value
      },
      comments: data.comments,
      documents: data.documents || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      changeLog: []
    };
  }

  private transformTripExpense(data: any): TripExpense {
    return {
      id: data.id,
      tripId: data.trip_id,
      expenseType: data.expense_type,
      amount: parseFloat(data.amount),
      description: data.description,
      receiptUrl: data.receipt_url,
      expenseDate: new Date(data.expense_date),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      userId: data.user_id
    };
  }

  // Методы для работы с аутентификацией
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // Методы для работы с логами активности
  async getActivityLogs() {
    const { data, error } = await this.supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  async createActivityLog(log: {
    action: string;
    entity_type?: string;
    entity_id?: string;
    details?: Record<string, any>;
    user_agent?: string;
  }) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        ...log
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Методы для работы с уведомлениями
  async getNotifications() {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async markNotificationAsRead(notificationId: string) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllNotificationsAsRead() {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('is_read', false);

    if (error) throw error;
  }

  async createNotification(notification: {
    title: string;
    message: string;
    type: string;
    related_entity_id?: string;
    related_entity_type?: string;
  }) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        ...notification
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async savePushToken(token: string, platform: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token,
        platform,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'token'
      });

    if (error) throw error;
  }

  async getPushTokens(userId?: string) {
    const targetUserId = userId || (await this.getCurrentUser())?.id;
    if (!targetUserId) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) throw error;
    return data || [];
  }

  // Методы для работы с контрагентами
  async getContractors(): Promise<Contractor[]> {
    const { data, error } = await this.supabase
      .from('contractors')
      .select(`
        *,
        contacts (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformContractor);
  }

  async saveContractor(contractor: any) {
    const { contacts, ...contractorData } = contractor;
    
    // Convert camelCase to snake_case for database
    const dbData = {
      ...contractorData,
      company_name: contractorData.companyName,
      created_at: contractorData.createdAt,
      updated_at: contractorData.updatedAt
    };
    
    const { data, error } = await this.supabase
      .from('contractors')
      .upsert(dbData)
      .select()
      .single();

    if (error) throw error;

    // Сохранение контактов
    if (contacts && contacts.length > 0) {
      const contactsData = contacts.map((contact: any) => ({
        ...contact,
        contractor_id: data.id
      }));

      const { error: contactsError } = await this.supabase
        .from('contacts')
        .upsert(contactsData);

      if (contactsError) throw contactsError;
    }

    return this.transformContractor(data);
  }

  async deleteContractor(id: string) {
    const { error } = await this.supabase
      .from('contractors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с водителями
  async getDrivers(): Promise<Driver[]> {
    const { data, error } = await this.supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformDriver);
  }

  async saveDriver(driver: any) {
    // Convert camelCase to snake_case for database
    const dbData = {
      ...driver,
      passport_data: driver.passportData,
      experience_years: driver.experienceYears,
      created_at: driver.createdAt,
      updated_at: driver.updatedAt
    };

    const { data, error } = await this.supabase
      .from('drivers')
      .upsert(dbData)
      .select()
      .single();

    if (error) throw error;
    return this.transformDriver(data);
  }

  async deleteDriver(id: string) {
    const { error } = await this.supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с транспортом
  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformVehicle);
  }

  async saveVehicle(vehicle: any) {
    // Convert camelCase to snake_case for database
    const dbData = {
      ...vehicle,
      license_plate: vehicle.licensePlate,
      registration_certificate: vehicle.registrationCertificate,
      insurance_policy: vehicle.insurancePolicy,
      insurance_expiry: vehicle.insuranceExpiry,
      technical_inspection_expiry: vehicle.technicalInspectionExpiry,
      created_at: vehicle.createdAt,
      updated_at: vehicle.updatedAt
    };

    const { data, error } = await this.supabase
      .from('vehicles')
      .upsert(dbData)
      .select()
      .single();

    if (error) throw error;
    return this.transformVehicle(data);
  }

  async deleteVehicle(id: string) {
    const { error } = await this.supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с маршрутами
  async getRoutes(): Promise<Route[]> {
    const { data, error } = await this.supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformRoute);
  }

  async saveRoute(route: any) {
    // Convert camelCase to snake_case for database
    const dbData = {
      ...route,
      point_a: route.pointA,
      point_b: route.pointB,
      distance_km: route.distanceKm,
      estimated_duration_hours: route.estimatedDurationHours,
      created_at: route.createdAt,
      updated_at: route.updatedAt
    };

    const { data, error } = await this.supabase
      .from('routes')
      .upsert(dbData)
      .select()
      .single();

    if (error) throw error;
    return this.transformRoute(data);
  }

  async deleteRoute(id: string) {
    const { error } = await this.supabase
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с типами грузов
  async getCargoTypes(): Promise<CargoType[]> {
    const { data, error } = await this.supabase
      .from('cargo_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformCargoType);
  }

  async saveCargoType(cargoType: any) {
    // Convert camelCase to snake_case for database
    const dbData = {
      ...cargoType,
      default_weight: cargoType.defaultWeight,
      default_volume: cargoType.defaultVolume,
      temperature_controlled: cargoType.temperatureControlled,
      created_at: cargoType.createdAt,
      updated_at: cargoType.updatedAt
    };

    const { data, error } = await this.supabase
      .from('cargo_types')
      .upsert(dbData)
      .select()
      .single();

    if (error) throw error;
    return this.transformCargoType(data);
  }

  async deleteCargoType(id: string) {
    const { error } = await this.supabase
      .from('cargo_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с рейсами
  async getTrips(): Promise<Trip[]> {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformTrip);
  }

  async saveTrip(trip: any) {
    // Convert camelCase to snake_case for database
    const dbData = {
      ...trip,
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
      created_at: trip.createdAt,
      updated_at: trip.updatedAt
    };

    const { data, error } = await this.supabase
      .from('trips')
      .upsert(dbData)
      .select()
      .single();

    if (error) throw error;
    return this.transformTrip(data);
  }

  async deleteTrip(id: string) {
    const { error } = await this.supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с расходами по рейсам
  async getTripExpenses(tripId: string): Promise<TripExpense[]> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false });

    if (error) throw error;

    return data.map(expense => ({
      ...expense,
      expenseDate: new Date(expense.expense_date),
      createdAt: new Date(expense.created_at),
      updatedAt: new Date(expense.updated_at)
    }));
  }

  async createTripExpense(expenseData: {
    tripId: string;
    expenseType: ExpenseType;
    amount: number;
    description?: string;
    expenseDate: Date;
  }): Promise<TripExpense> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('trip_expenses')
      .insert({
        trip_id: expenseData.tripId,
        expense_type: expenseData.expenseType,
        amount: expenseData.amount,
        description: expenseData.description,
        expense_date: expenseData.expenseDate.toISOString(),
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      expenseDate: new Date(data.expense_date),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async updateTripExpense(expenseId: string, expenseData: {
    tripId: string;
    expenseType: ExpenseType;
    amount: number;
    description?: string;
    expenseDate: Date;
  }): Promise<TripExpense> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .update({
        expense_type: expenseData.expenseType,
        amount: expenseData.amount,
        description: expenseData.description,
        expense_date: expenseData.expenseDate.toISOString()
      })
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      expenseDate: new Date(data.expense_date),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async deleteTripExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('trip_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  }

  async getTripTotalExpenses(tripId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_trip_total_expenses', { trip_uuid: tripId });

    if (error) throw error;
    return parseFloat(data) || 0;
  }

  // Обновленный метод для получения статистики дашборда с расходами
  async getDashboardStats() {
    const [trips, contractors, drivers, vehicles] = await Promise.all([
      this.getTrips(),
      this.getContractors(),
      this.getDrivers(),
      this.getVehicles()
    ]);

    // Получаем все расходы
    const { data: expensesData, error: expensesError } = await this.supabase
      .from('trip_expenses')
      .select('*');

    if (expensesError) throw expensesError;

    const expenses = (expensesData || []).map(this.transformTripExpense);

    const activeTrips = trips.filter(trip => trip.status === 'in_progress').length;
    const completedTrips = trips.filter(trip => trip.status === 'completed').length;
    const plannedTrips = trips.filter(trip => trip.status === 'planned').length;
    const cancelledTrips = trips.filter(trip => trip.status === 'cancelled').length;

    // Финансовые расчеты
    const totalCargoValue = trips.reduce((sum, trip) => sum + (trip.cargo.value || 0), 0);
    const completedCargoValue = trips
      .filter(trip => trip.status === 'completed')
      .reduce((sum, trip) => sum + (trip.cargo.value || 0), 0);
    
    const totalWeight = trips.reduce((sum, trip) => sum + (trip.cargo.weight || 0), 0);
    const totalVolume = trips.reduce((sum, trip) => sum + (trip.cargo.volume || 0), 0);

    // Статистика по расходам
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const completedTripsIds = trips.filter(trip => trip.status === 'completed').map(trip => trip.id);
    const completedTripsExpenses = expenses
      .filter(expense => completedTripsIds.includes(expense.tripId))
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Расходы по типам
    const expensesByType = expenses.reduce((acc, expense) => {
      acc[expense.expenseType] = (acc[expense.expenseType] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Статистика по месяцам (последние 6 месяцев)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTrips = trips.filter(trip => {
        const tripDate = new Date(trip.departureDate);
        return tripDate.getMonth() === date.getMonth() && 
               tripDate.getFullYear() === date.getFullYear();
      });
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expenseDate);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      });

      monthlyStats.push({
        month: date.toLocaleDateString('ru-RU', { month: 'short' }),
        trips: monthTrips.length,
        revenue: monthTrips.reduce((sum, trip) => sum + (trip.cargo.value || 0), 0),
        weight: monthTrips.reduce((sum, trip) => sum + (trip.cargo.weight || 0), 0),
        expenses: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      });
    }

    // Прибыльность
    const profit = completedCargoValue - completedTripsExpenses;
    const profitMargin = completedCargoValue > 0 ? (profit / completedCargoValue) * 100 : 0;

    return {
      activeTrips,
      totalTrips: trips.length,
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
      totalExpenses,
      completedTripsExpenses,
      expensesByType,
      profit,
      profitMargin,
      monthlyStats,
      averageCargoValue: trips.length > 0 ? totalCargoValue / trips.length : 0,
      completionRate: trips.length > 0 ? (completedTrips / trips.length) * 100 : 0,
      averageExpensePerTrip: trips.length > 0 ? totalExpenses / trips.length : 0
    };
  }

  async getAdvancedStats(filters: any): Promise<any> {
    // Базовая статистика
    const basicStats = await this.getDashboardStats();
    
    // Расходы по типам
    const { data: expensesByType } = await supabase
      .from('trip_expenses')
      .select('expense_type, amount');

    const expensesByTypeMap = expensesByType?.reduce((acc, expense) => {
      acc[expense.expense_type] = (acc[expense.expense_type] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    // Производительность водителей
    const { data: driverPerformance } = await supabase
      .from('trips')
      .select('driver_name, driver_id, cargo_value')
      .not('driver_id', 'is', null);

    const driverStats = driverPerformance?.reduce((acc, trip) => {
      const key = trip.driver_id || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          driverId: key,
          driverName: trip.driver_name,
          tripsCount: 0,
          totalRevenue: 0,
          totalExpenses: 0
        };
      }
      acc[key].tripsCount++;
      acc[key].totalRevenue += trip.cargo_value || 0;
      return acc;
    }, {} as Record<string, any>) || {};

    return {
      ...basicStats,
      expensesByType: expensesByTypeMap,
      completedTripsExpenses: basicStats.totalExpenses,
      averageExpensePerTrip: basicStats.totalTrips > 0 ? basicStats.totalExpenses / basicStats.totalTrips : 0,
      driverPerformance: Object.values(driverStats),
      topRoutes: [],
      vehicleUtilization: []
    };
  }
}

export const supabaseService = new SupabaseService();
