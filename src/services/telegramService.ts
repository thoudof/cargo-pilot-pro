import { supabase } from '@/integrations/supabase/client';

export interface DriverNotificationPayload {
  target: 'driver';
  type: 'new_trip' | 'trip_updated' | 'trip_reminder';
  driverId: string;
  tripId: string;
  tripDetails?: {
    pointA: string;
    pointB: string;
    departureDate: string;
    cargoDescription?: string;
  };
  changes?: string[];
}

export type NotificationEventType = 
  | 'trip_created'
  | 'trip_updated'
  | 'trip_status_changed'
  | 'trip_deleted'
  | 'driver_created'
  | 'driver_updated'
  | 'driver_deleted'
  | 'vehicle_created'
  | 'vehicle_updated'
  | 'vehicle_deleted'
  | 'expense_created'
  | 'document_uploaded';

export interface AdminNotificationPayload {
  target: 'admins';
  eventType: NotificationEventType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  message?: string;
}

class TelegramService {
  // Generate a link code for driver to connect telegram
  async generateLinkCode(driverId: string): Promise<string> {
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Code valid for 24 hours

    const { error } = await supabase
      .from('drivers')
      .update({
        telegram_link_code: code,
        telegram_link_code_expires_at: expiresAt.toISOString(),
      })
      .eq('id', driverId);

    if (error) {
      console.error('Failed to generate link code:', error);
      throw error;
    }

    return code;
  }

  // Get link code for driver
  async getLinkCode(driverId: string): Promise<{ code: string | null; expiresAt: Date | null; isLinked: boolean }> {
    const { data, error } = await supabase
      .from('drivers')
      .select('telegram_link_code, telegram_link_code_expires_at, telegram_chat_id')
      .eq('id', driverId)
      .single();

    if (error) {
      console.error('Failed to get link code:', error);
      throw error;
    }

    return {
      code: data.telegram_link_code,
      expiresAt: data.telegram_link_code_expires_at ? new Date(data.telegram_link_code_expires_at) : null,
      isLinked: !!data.telegram_chat_id,
    };
  }

  // Check if driver has telegram connected
  async isDriverLinked(driverId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('drivers')
      .select('telegram_chat_id')
      .eq('id', driverId)
      .single();

    if (error) return false;
    return !!data?.telegram_chat_id;
  }

  // Unlink driver from telegram
  async unlinkDriver(driverId: string): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update({
        telegram_chat_id: null,
        telegram_link_code: null,
        telegram_link_code_expires_at: null,
      })
      .eq('id', driverId);

    if (error) {
      console.error('Failed to unlink driver:', error);
      throw error;
    }
  }

  // Send notification to driver via telegram
  async sendDriverNotification(payload: Omit<DriverNotificationPayload, 'target'>): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { ...payload, target: 'driver' },
      });

      if (error) {
        console.error('Failed to send telegram notification:', error);
        return false;
      }

      return data?.ok ?? false;
    } catch (error) {
      console.error('Error sending telegram notification:', error);
      return false;
    }
  }

  // Send notification to subscribed admins
  async sendAdminNotification(payload: Omit<AdminNotificationPayload, 'target'>): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { ...payload, target: 'admins' },
      });

      if (error) {
        console.error('Failed to send admin telegram notification:', error);
        return false;
      }

      return data?.ok ?? false;
    } catch (error) {
      console.error('Error sending admin telegram notification:', error);
      return false;
    }
  }

  // Notify driver about new assigned trip
  async notifyNewTrip(driverId: string, tripId: string, tripDetails: {
    pointA: string;
    pointB: string;
    departureDate: string;
    cargoDescription?: string;
  }): Promise<boolean> {
    return this.sendDriverNotification({
      type: 'new_trip',
      driverId,
      tripId,
      tripDetails,
    });
  }

  // Notify driver about trip changes
  async notifyTripUpdated(driverId: string, tripId: string, tripDetails: {
    pointA: string;
    pointB: string;
    departureDate: string;
  }, changes: string[]): Promise<boolean> {
    return this.sendDriverNotification({
      type: 'trip_updated',
      driverId,
      tripId,
      tripDetails,
      changes,
    });
  }

  // Send trip reminder
  async sendTripReminder(driverId: string, tripId: string, tripDetails: {
    pointA: string;
    pointB: string;
    departureDate: string;
  }): Promise<boolean> {
    return this.sendDriverNotification({
      type: 'trip_reminder',
      driverId,
      tripId,
      tripDetails,
    });
  }

  // === Admin notification helpers ===

  async notifyTripCreated(tripDetails: {
    tripId: string;
    pointA: string;
    pointB: string;
    departureDate: string;
    driverName?: string;
  }): Promise<boolean> {
    return this.sendAdminNotification({
      eventType: 'trip_created',
      entityId: tripDetails.tripId,
      entityName: `${tripDetails.pointA} → ${tripDetails.pointB}`,
      details: {
        pointA: tripDetails.pointA,
        pointB: tripDetails.pointB,
        departureDate: tripDetails.departureDate,
      },
      message: tripDetails.driverName ? `Водитель: ${tripDetails.driverName}` : undefined,
    });
  }

  async notifyTripStatusChanged(tripId: string, tripName: string, oldStatus: string, newStatus: string): Promise<boolean> {
    return this.sendAdminNotification({
      eventType: 'trip_status_changed',
      entityId: tripId,
      entityName: tripName,
      details: { status: newStatus },
      message: `${oldStatus} → ${newStatus}`,
    });
  }

  async notifyDriverCreated(driverId: string, driverName: string): Promise<boolean> {
    return this.sendAdminNotification({
      eventType: 'driver_created',
      entityId: driverId,
      entityName: driverName,
    });
  }

  async notifyVehicleCreated(vehicleId: string, vehicleName: string): Promise<boolean> {
    return this.sendAdminNotification({
      eventType: 'vehicle_created',
      entityId: vehicleId,
      entityName: vehicleName,
    });
  }

  async notifyExpenseCreated(tripId: string, amount: number, category: string): Promise<boolean> {
    return this.sendAdminNotification({
      eventType: 'expense_created',
      entityId: tripId,
      details: { amount },
      message: `${category}: ${amount} ₽`,
    });
  }

  async notifyDocumentUploaded(tripId: string, fileName: string, documentType: string): Promise<boolean> {
    return this.sendAdminNotification({
      eventType: 'document_uploaded',
      entityId: tripId,
      entityName: fileName,
      message: `Тип: ${documentType}`,
    });
  }

  // Get bot link with code
  getBotLink(botUsername: string, code?: string): string {
    if (code) {
      return `https://t.me/${botUsername}?start=${code}`;
    }
    return `https://t.me/${botUsername}`;
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const telegramService = new TelegramService();