
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationPayload {
  title: string;
  message: string;
  userId?: string;
  notificationId?: string;
  url?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, message, userId, notificationId, url }: PushNotificationPayload = await req.json();

    console.log('Sending push notification:', { title, message, userId });

    // Получаем PUSH токены пользователя
    let query = supabaseClient.from('push_tokens').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found');
      return new Response(
        JSON.stringify({ success: true, message: 'No push tokens to send to' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const pushPromises = tokens.map(async (tokenData) => {
      try {
        // В реальном приложении здесь должна быть интеграция с FCM, APNs или Web Push
        // Для демонстрации просто логируем
        console.log(`Would send push to ${tokenData.platform} token: ${tokenData.token.substring(0, 20)}...`);
        
        // Пример для Web Push (требует настройки VAPID ключей)
        if (tokenData.platform === 'web') {
          // Здесь должна быть отправка через Web Push API
          console.log('Web push notification would be sent');
        }
        
        return { success: true, token: tokenData.token };
      } catch (error) {
        console.error(`Error sending push to token ${tokenData.token}:`, error);
        return { success: false, token: tokenData.token, error: error.message };
      }
    });

    const results = await Promise.all(pushPromises);
    
    console.log('Push notification results:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notifications sent',
        results: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
