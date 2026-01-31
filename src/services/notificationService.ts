import { supabase } from '@/integrations/supabase/client';
import { telegramService } from './telegramService';

export type NotificationEvent = 
  | 'trip_assigned'
  | 'trip_status_changed'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'expense_added'
  | 'document_uploaded';

interface NotificationConfig {
  title: string;
  getMessage: (data: Record<string, any>) => string;
  url?: string;
  targetRoles?: string[];
  targetUserId?: (data: Record<string, any>) => string | undefined;
}

const notificationConfigs: Record<NotificationEvent, NotificationConfig> = {
  trip_assigned: {
    title: 'Назначен новый рейс',
    getMessage: (data) => `Вам назначен рейс: ${data.pointA} → ${data.pointB}`,
    url: '/driver',
    targetUserId: (data) => data.driverUserId
  },
  trip_status_changed: {
    title: 'Статус рейса изменён',
    getMessage: (data) => `Рейс ${data.pointA} → ${data.pointB}: ${data.newStatus}`,
    url: '/trips',
    targetRoles: ['admin', 'dispatcher']
  },
  trip_completed: {
    title: 'Рейс завершён',
    getMessage: (data) => `Рейс ${data.pointA} → ${data.pointB} успешно завершён`,
    url: '/trips',
    targetRoles: ['admin', 'dispatcher']
  },
  trip_cancelled: {
    title: 'Рейс отменён',
    getMessage: (data) => `Рейс ${data.pointA} → ${data.pointB} был отменён`,
    url: '/trips',
    targetRoles: ['admin', 'dispatcher']
  },
  expense_added: {
    title: 'Добавлен расход',
    getMessage: (data) => `Добавлен расход: ${data.category} - ${data.amount} ₽`,
    url: '/trips',
    targetRoles: ['admin', 'dispatcher']
  },
  document_uploaded: {
    title: 'Загружен документ',
    getMessage: (data) => `Загружен документ: ${data.fileName}`,
    url: '/trips',
    targetRoles: ['admin', 'dispatcher']
  }
};

const statusLabels: Record<string, string> = {
  planned: 'Запланирован',
  in_progress: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён'
};

export async function sendNotification(
  event: NotificationEvent,
  data: Record<string, any>
): Promise<void> {
  const config = notificationConfigs[event];
  if (!config) {
    console.error('Unknown notification event:', event);
    return;
  }

  try {
    const payload: Record<string, any> = {
      title: config.title,
      message: config.getMessage({
        ...data,
        newStatus: statusLabels[data.newStatus] || data.newStatus
      }),
      url: config.url || '/',
      type: event
    };

    // Determine target users
    if (config.targetUserId) {
      const userId = config.targetUserId(data);
      if (userId) {
        payload.userId = userId;
      }
    }

    if (config.targetRoles) {
      payload.roles = config.targetRoles;
    }

    console.log('Sending notification:', payload);

    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: payload
    });

    if (error) {
      console.error('Failed to send notification:', error);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Get driver's user ID from driver ID
export async function getDriverUserId(driverId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('driver_users')
      .select('user_id')
      .eq('driver_id', driverId)
      .single();

    if (error || !data) {
      return undefined;
    }

    return data.user_id;
  } catch {
    return undefined;
  }
}

// Convenience functions for specific events
export async function notifyTripAssigned(
  tripId: string,
  driverId: string,
  pointA: string,
  pointB: string,
  departureDate?: string,
  cargoDescription?: string
): Promise<void> {
  const driverUserId = await getDriverUserId(driverId);
  
  // Send push notification if driver is linked to user
  if (driverUserId) {
    await sendNotification('trip_assigned', {
      tripId,
      driverId,
      driverUserId,
      pointA,
      pointB
    });
  }

  // Always try to send Telegram notification
  try {
    await telegramService.notifyNewTrip(driverId, tripId, {
      pointA,
      pointB,
      departureDate: departureDate || new Date().toISOString(),
      cargoDescription
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

export async function notifyTripStatusChanged(
  tripId: string,
  pointA: string,
  pointB: string,
  oldStatus: string,
  newStatus: string,
  driverId?: string,
  departureDate?: string
): Promise<void> {
  // Special handling for completed/cancelled
  if (newStatus === 'completed') {
    await sendNotification('trip_completed', { tripId, pointA, pointB });
  } else if (newStatus === 'cancelled') {
    await sendNotification('trip_cancelled', { tripId, pointA, pointB });
  } else {
    await sendNotification('trip_status_changed', {
      tripId,
      pointA,
      pointB,
      oldStatus,
      newStatus
    });
  }

  // Send Telegram notification about trip update if driver is assigned
  if (driverId) {
    try {
      const statusLabelsRu: Record<string, string> = {
        planned: 'Запланирован',
        in_progress: 'В пути',
        completed: 'Завершён',
        cancelled: 'Отменён'
      };

      await telegramService.notifyTripUpdated(driverId, tripId, {
        pointA,
        pointB,
        departureDate: departureDate || new Date().toISOString()
      }, [`Статус изменён: ${statusLabelsRu[newStatus] || newStatus}`]);
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }
}

export async function notifyExpenseAdded(
  tripId: string,
  category: string,
  amount: number
): Promise<void> {
  await sendNotification('expense_added', { tripId, category, amount });
}

export async function notifyDocumentUploaded(
  tripId: string,
  fileName: string
): Promise<void> {
  await sendNotification('document_uploaded', { tripId, fileName });
}
