import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_API = 'https://api.telegram.org/bot';

type NotificationEventType = 
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

interface DriverNotificationPayload {
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

interface AdminNotificationPayload {
  target: 'admins';
  eventType: NotificationEventType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  message?: string;
}

type NotificationPayload = DriverNotificationPayload | AdminNotificationPayload;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not configured');
    return new Response(JSON.stringify({ error: 'Bot token not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: NotificationPayload = await req.json();
    console.log('Sending telegram notification:', JSON.stringify(payload));

    if (payload.target === 'admins') {
      return await handleAdminNotification(supabase, TELEGRAM_BOT_TOKEN, payload);
    } else {
      return await handleDriverNotification(supabase, TELEGRAM_BOT_TOKEN, payload);
    }

  } catch (error) {
    console.error('Error sending telegram notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleAdminNotification(
  supabase: any, 
  token: string, 
  payload: AdminNotificationPayload
): Promise<Response> {
  // Get all active admin subscriptions that have this event type
  const { data: subscriptions, error } = await supabase
    .from('admin_telegram_subscriptions')
    .select('telegram_chat_id, event_types')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch admin subscriptions:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No admin subscriptions found');
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Filter subscriptions that include this event type
  const relevantSubs = subscriptions.filter((sub: any) => 
    Array.isArray(sub.event_types) && sub.event_types.includes(payload.eventType)
  );

  if (relevantSubs.length === 0) {
    console.log('No subscriptions for event type:', payload.eventType);
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Build message
  const message = buildAdminMessage(payload);

  // Send to all subscribed admins
  let sentCount = 0;
  for (const sub of relevantSubs) {
    try {
      const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: sub.telegram_chat_id,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        sentCount++;
      } else {
        const err = await response.text();
        console.error('Failed to send to admin:', sub.telegram_chat_id, err);
      }
    } catch (e) {
      console.error('Error sending to admin:', e);
    }
  }

  console.log(`Sent admin notification to ${sentCount}/${relevantSubs.length} subscribers`);
  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildAdminMessage(payload: AdminNotificationPayload): string {
  const icons: Record<NotificationEventType, string> = {
    trip_created: '🚚',
    trip_updated: '✏️',
    trip_status_changed: '🔄',
    trip_deleted: '🗑️',
    driver_created: '👤',
    driver_updated: '👤',
    driver_deleted: '👤',
    vehicle_created: '🚛',
    vehicle_updated: '🚛',
    vehicle_deleted: '🚛',
    expense_created: '💰',
    document_uploaded: '📄',
  };

  const titles: Record<NotificationEventType, string> = {
    trip_created: 'Создан новый рейс',
    trip_updated: 'Рейс изменён',
    trip_status_changed: 'Статус рейса изменён',
    trip_deleted: 'Рейс удалён',
    driver_created: 'Добавлен новый водитель',
    driver_updated: 'Водитель изменён',
    driver_deleted: 'Водитель удалён',
    vehicle_created: 'Добавлено новое ТС',
    vehicle_updated: 'ТС изменено',
    vehicle_deleted: 'ТС удалено',
    expense_created: 'Добавлен новый расход',
    document_uploaded: 'Загружен документ',
  };

  const icon = icons[payload.eventType] || '📢';
  const title = titles[payload.eventType] || 'Событие системы';

  let message = `${icon} <b>${title}</b>\n`;

  if (payload.entityName) {
    message += `\n📌 ${payload.entityName}`;
  }

  if (payload.message) {
    message += `\n${payload.message}`;
  }

  if (payload.details) {
    const details = payload.details;
    if (details.pointA && details.pointB) {
      message += `\n📍 ${details.pointA} → ${details.pointB}`;
    }
    if (details.departureDate) {
      message += `\n📅 ${formatDate(details.departureDate)}`;
    }
    if (details.status) {
      message += `\n🔄 Статус: ${details.status}`;
    }
    if (details.amount) {
      message += `\n💵 Сумма: ${details.amount} ₽`;
    }
    if (details.changes && Array.isArray(details.changes)) {
      message += `\n\nИзменения:`;
      details.changes.forEach((change: string) => {
        message += `\n• ${change}`;
      });
    }
  }

  message += `\n\n<i>Откройте приложение для подробностей</i>`;

  return message;
}

async function handleDriverNotification(
  supabase: any, 
  token: string, 
  payload: DriverNotificationPayload
): Promise<Response> {
  // Get driver's telegram chat_id
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('telegram_chat_id, name')
    .eq('id', payload.driverId)
    .single();

  if (driverError || !driver?.telegram_chat_id) {
    console.log('Driver has no telegram linked:', payload.driverId);
    return new Response(JSON.stringify({ 
      ok: false, 
      reason: 'Driver has no telegram linked' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let message = '';
  const details = payload.tripDetails;

  switch (payload.type) {
    case 'new_trip':
      message = `🚚 <b>Новый рейс назначен!</b>\n\n`;
      if (details) {
        message += `📍 Маршрут: ${details.pointA} → ${details.pointB}\n`;
        message += `📅 Дата отправления: ${formatDate(details.departureDate)}\n`;
        if (details.cargoDescription) {
          message += `📦 Груз: ${details.cargoDescription}\n`;
        }
      }
      message += `\nОткройте приложение для подробностей.`;
      break;

    case 'trip_updated':
      message = `✏️ <b>Рейс изменён</b>\n\n`;
      if (details) {
        message += `📍 Маршрут: ${details.pointA} → ${details.pointB}\n`;
        message += `📅 Дата: ${formatDate(details.departureDate)}\n`;
      }
      if (payload.changes && payload.changes.length > 0) {
        message += `\nИзменения:\n`;
        payload.changes.forEach(change => {
          message += `• ${change}\n`;
        });
      }
      break;

    case 'trip_reminder':
      message = `⏰ <b>Напоминание о рейсе</b>\n\n`;
      if (details) {
        message += `📍 Маршрут: ${details.pointA} → ${details.pointB}\n`;
        message += `📅 Отправление: ${formatDate(details.departureDate)}\n`;
      }
      message += `\nНе забудьте подготовиться к рейсу!`;
      break;
  }

  // Send message
  const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: driver.telegram_chat_id,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send telegram message:', error);
    return new Response(JSON.stringify({ ok: false, error }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('Telegram notification sent successfully to driver:', driver.name);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
