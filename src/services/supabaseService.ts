
import { supabase } from '@/integrations/supabase/client';
import { Contractor, Trip, Contact, TripStatus } from '@/types';

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
