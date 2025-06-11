
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
}

export const supabaseService = new SupabaseService();
