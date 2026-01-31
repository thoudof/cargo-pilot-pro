import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_API = 'https://api.telegram.org/bot';

interface NotificationPayload {
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
    const response = await fetch(`${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
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

  } catch (error) {
    console.error('Error sending telegram notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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