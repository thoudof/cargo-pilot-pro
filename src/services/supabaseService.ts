import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Contractor, Driver, Vehicle, CargoType, Route, Trip } from '@/types';

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

  // Метод для получения статистики дашборда
  async getDashboardStats() {
    const [trips, contractors, drivers, vehicles] = await Promise.all([
      this.getTrips(),
      this.getContractors(),
      this.getDrivers(),
      this.getVehicles()
    ]);

    const activeTrips = trips.filter(trip => trip.status === 'in_progress').length;

    return {
      activeTrips,
      totalTrips: trips.length,
      contractors: contractors.length,
      drivers: drivers.length,
      vehicles: vehicles.length
    };
  }
}

export const supabaseService = new SupabaseService();
