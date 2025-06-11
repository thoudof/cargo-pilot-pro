
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class SupabaseService {
  public supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
  async getContractors() {
    const { data, error } = await this.supabase
      .from('contractors')
      .select(`
        *,
        contacts (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveContractor(contractor: any) {
    const { contacts, ...contractorData } = contractor;
    
    const { data, error } = await this.supabase
      .from('contractors')
      .upsert(contractorData)
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

    return data;
  }

  async deleteContractor(id: string) {
    const { error } = await this.supabase
      .from('contractors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с рейсами
  async getTrips() {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveTrip(trip: any) {
    const { data, error } = await this.supabase
      .from('trips')
      .upsert(trip)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTrip(id: string) {
    const { error } = await this.supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с водителями
  async getDrivers() {
    const { data, error } = await this.supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveDriver(driver: any) {
    const { data, error } = await this.supabase
      .from('drivers')
      .upsert(driver)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDriver(id: string) {
    const { error } = await this.supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с транспортом
  async getVehicles() {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveVehicle(vehicle: any) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .upsert(vehicle)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVehicle(id: string) {
    const { error } = await this.supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с маршрутами
  async getRoutes() {
    const { data, error } = await this.supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveRoute(route: any) {
    const { data, error } = await this.supabase
      .from('routes')
      .upsert(route)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRoute(id: string) {
    const { error } = await this.supabase
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Методы для работы с типами грузов
  async getCargoTypes() {
    const { data, error } = await this.supabase
      .from('cargo_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveCargoType(cargoType: any) {
    const { data, error } = await this.supabase
      .from('cargo_types')
      .upsert(cargoType)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCargoType(id: string) {
    const { error } = await this.supabase
      .from('cargo_types')
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
