import { supabase } from '@/integrations/supabase/client';
import { Contractor, Trip, Contact, TripStatus, Driver, Vehicle, Route, CargoType } from '@/types';

class SupabaseService {
  // Contractors
  async getContractors(): Promise<Contractor[]> {
    const { data: contractorData, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .order('created_at', { ascending: false });

    if (contractorError) throw contractorError;

    const contractors: Contractor[] = [];

    for (const contractor of contractorData || []) {
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('contractor_id', contractor.id);

      if (contactsError) throw contactsError;

      contractors.push({
        id: contractor.id,
        companyName: contractor.company_name,
        inn: contractor.inn,
        address: contractor.address,
        notes: contractor.notes || '',
        contacts: (contacts || []).map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          position: contact.position || ''
        })),
        createdAt: new Date(contractor.created_at),
        updatedAt: new Date(contractor.updated_at)
      });
    }

    return contractors;
  }

  async saveContractor(contractor: Contractor): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const contractorData = {
      id: contractor.id,
      company_name: contractor.companyName,
      inn: contractor.inn,
      address: contractor.address,
      notes: contractor.notes,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    const { error: contractorError } = await supabase
      .from('contractors')
      .upsert(contractorData);

    if (contractorError) throw contractorError;

    // Delete existing contacts
    await supabase
      .from('contacts')
      .delete()
      .eq('contractor_id', contractor.id);

    // Insert new contacts
    if (contractor.contacts.length > 0) {
      const contactsData = contractor.contacts.map(contact => ({
        id: contact.id,
        contractor_id: contractor.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        position: contact.position
      }));

      const { error: contactsError } = await supabase
        .from('contacts')
        .insert(contactsData);

      if (contactsError) throw contactsError;
    }
  }

  async deleteContractor(id: string): Promise<void> {
    const { error } = await supabase
      .from('contractors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((driver: any) => ({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      license: driver.license,
      passportData: driver.passport_data,
      experienceYears: driver.experience_years,
      notes: driver.notes,
      createdAt: new Date(driver.created_at),
      updatedAt: new Date(driver.updated_at)
    }));
  }

  async saveDriver(driver: Driver): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const driverData = {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      license: driver.license,
      passport_data: driver.passportData,
      experience_years: driver.experienceYears,
      notes: driver.notes,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('drivers')
      .upsert(driverData);

    if (error) throw error;
  }

  async deleteDriver(id: string): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((vehicle: any) => ({
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.license_plate,
      capacity: vehicle.capacity,
      year: vehicle.year,
      vin: vehicle.vin,
      registrationCertificate: vehicle.registration_certificate,
      insurancePolicy: vehicle.insurance_policy,
      insuranceExpiry: vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) : undefined,
      technicalInspectionExpiry: vehicle.technical_inspection_expiry ? new Date(vehicle.technical_inspection_expiry) : undefined,
      notes: vehicle.notes,
      createdAt: new Date(vehicle.created_at),
      updatedAt: new Date(vehicle.updated_at)
    }));
  }

  async saveVehicle(vehicle: Vehicle): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const vehicleData = {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      license_plate: vehicle.licensePlate,
      capacity: vehicle.capacity,
      year: vehicle.year,
      vin: vehicle.vin,
      registration_certificate: vehicle.registrationCertificate,
      insurance_policy: vehicle.insurancePolicy,
      insurance_expiry: vehicle.insuranceExpiry?.toISOString().split('T')[0],
      technical_inspection_expiry: vehicle.technicalInspectionExpiry?.toISOString().split('T')[0],
      notes: vehicle.notes,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('vehicles')
      .upsert(vehicleData);

    if (error) throw error;
  }

  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Routes
  async getRoutes(): Promise<Route[]> {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((route: any) => ({
      id: route.id,
      name: route.name,
      pointA: route.point_a,
      pointB: route.point_b,
      distanceKm: route.distance_km,
      estimatedDurationHours: route.estimated_duration_hours,
      notes: route.notes,
      createdAt: new Date(route.created_at),
      updatedAt: new Date(route.updated_at)
    }));
  }

  async saveRoute(route: Route): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const routeData = {
      id: route.id,
      name: route.name,
      point_a: route.pointA,
      point_b: route.pointB,
      distance_km: route.distanceKm,
      estimated_duration_hours: route.estimatedDurationHours,
      notes: route.notes,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('routes')
      .upsert(routeData);

    if (error) throw error;
  }

  async deleteRoute(id: string): Promise<void> {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // CargoTypes
  async getCargoTypes(): Promise<CargoType[]> {
    const { data, error } = await supabase
      .from('cargo_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((cargoType: any) => ({
      id: cargoType.id,
      name: cargoType.name,
      description: cargoType.description,
      defaultWeight: cargoType.default_weight,
      defaultVolume: cargoType.default_volume,
      hazardous: cargoType.hazardous,
      temperatureControlled: cargoType.temperature_controlled,
      fragile: cargoType.fragile,
      createdAt: new Date(cargoType.created_at),
      updatedAt: new Date(cargoType.updated_at)
    }));
  }

  async saveCargoType(cargoType: CargoType): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const cargoTypeData = {
      id: cargoType.id,
      name: cargoType.name,
      description: cargoType.description,
      default_weight: cargoType.defaultWeight,
      default_volume: cargoType.defaultVolume,
      hazardous: cargoType.hazardous,
      temperature_controlled: cargoType.temperatureControlled,
      fragile: cargoType.fragile,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('cargo_types')
      .upsert(cargoTypeData);

    if (error) throw error;
  }

  async deleteCargoType(id: string): Promise<void> {
    const { error } = await supabase
      .from('cargo_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Trips
  async getTrips(): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((trip: any) => ({
      id: trip.id,
      status: trip.status as TripStatus,
      departureDate: new Date(trip.departure_date),
      arrivalDate: trip.arrival_date ? new Date(trip.arrival_date) : undefined,
      pointA: trip.point_a,
      pointB: trip.point_b,
      contractorId: trip.contractor_id,
      driverId: trip.driver_id,
      vehicleId: trip.vehicle_id,
      routeId: trip.route_id,
      cargoTypeId: trip.cargo_type_id,
      driver: {
        name: trip.driver_name,
        phone: trip.driver_phone,
        license: trip.driver_license || ''
      },
      vehicle: {
        brand: trip.vehicle_brand,
        model: trip.vehicle_model,
        licensePlate: trip.vehicle_license_plate,
        capacity: trip.vehicle_capacity || undefined
      },
      cargo: {
        description: trip.cargo_description,
        weight: trip.cargo_weight,
        volume: trip.cargo_volume,
        value: trip.cargo_value || undefined
      },
      comments: trip.comments || '',
      documents: trip.documents || [],
      createdAt: new Date(trip.created_at),
      updatedAt: new Date(trip.updated_at),
      changeLog: []
    }));
  }

  async saveTrip(trip: Trip): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const tripData = {
      id: trip.id,
      status: trip.status,
      departure_date: trip.departureDate.toISOString(),
      arrival_date: trip.arrivalDate?.toISOString() || null,
      point_a: trip.pointA,
      point_b: trip.pointB,
      contractor_id: trip.contractorId,
      driver_id: trip.driverId || null,
      vehicle_id: trip.vehicleId || null,
      route_id: trip.routeId || null,
      cargo_type_id: trip.cargoTypeId || null,
      driver_name: trip.driver.name,
      driver_phone: trip.driver.phone,
      driver_license: trip.driver.license || null,
      vehicle_brand: trip.vehicle.brand,
      vehicle_model: trip.vehicle.model,
      vehicle_license_plate: trip.vehicle.licensePlate,
      vehicle_capacity: trip.vehicle.capacity || null,
      cargo_description: trip.cargo.description,
      cargo_weight: trip.cargo.weight,
      cargo_volume: trip.cargo.volume,
      cargo_value: trip.cargo.value || null,
      comments: trip.comments || null,
      documents: trip.documents,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('trips')
      .upsert(tripData);

    if (error) throw error;
  }

  async deleteTrip(id: string): Promise<void> {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Dashboard statistics
  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [tripsResult, contractorsResult, driversResult, vehiclesResult] = await Promise.all([
      supabase.from('trips').select('id, status').eq('user_id', user.id),
      supabase.from('contractors').select('id').eq('user_id', user.id),
      supabase.from('drivers').select('id').eq('user_id', user.id),
      supabase.from('vehicles').select('id').eq('user_id', user.id)
    ]);

    const activeTrips = tripsResult.data?.filter(trip => 
      trip.status === 'in_progress' || trip.status === 'planned'
    ).length || 0;

    return {
      activeTrips,
      totalTrips: tripsResult.data?.length || 0,
      contractors: contractorsResult.data?.length || 0,
      drivers: driversResult.data?.length || 0,
      vehicles: vehiclesResult.data?.length || 0
    };
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

  // Auth
  async signUp(email: string, password: string, userData: { username: string; fullName: string; role?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.fullName,
          role: userData.role || 'dispatcher'
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { data, error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();

    return { data, error };
  }
}

export const supabaseService = new SupabaseService();
