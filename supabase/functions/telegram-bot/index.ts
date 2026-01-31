import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_API = 'https://api.telegram.org/bot';

serve(async (req) => {
  // Handle CORS preflight
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
    // Check if request has a body
    const bodyText = await req.text();
    
    if (!bodyText) {
      console.log('Empty request body - likely a health check');
      return new Response(JSON.stringify({ ok: true, message: 'Bot is running' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Invalid JSON body:', bodyText);
      return new Response(JSON.stringify({ ok: true, message: 'Invalid request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Telegram webhook received:', JSON.stringify(body));

    // Handle Telegram webhook (incoming messages from bot)
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text || '';

      // Handle /start command with link code
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const linkCode = parts[1];
          
          // Check if it's an admin link code
          if (linkCode.startsWith('ADMIN_')) {
            await handleAdminLink(supabase, TELEGRAM_BOT_TOKEN, chatId, linkCode);
          } else {
            await handleDriverLink(supabase, TELEGRAM_BOT_TOKEN, chatId, linkCode);
          }
        } else {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            '👋 Добро пожаловать в бот Transport Management!\n\nЧтобы подключиться, используйте ссылку из приложения или введите код командой /link КОД');
        }
      }
      // Handle /link command
      else if (text.startsWith('/link')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const linkCode = parts[1].toUpperCase();
          
          // Check if it's an admin link code
          if (linkCode.startsWith('ADMIN_')) {
            await handleAdminLink(supabase, TELEGRAM_BOT_TOKEN, chatId, linkCode);
          } else {
            await handleDriverLinkCommand(supabase, TELEGRAM_BOT_TOKEN, chatId, linkCode);
          }
        } else {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            'Используйте команду в формате: /link КОД');
        }
      }
      // Handle /status command
      else if (text === '/status') {
        // Check driver
        const { data: driver } = await supabase
          .from('drivers')
          .select('name')
          .eq('telegram_chat_id', chatId.toString())
          .single();

        // Check admin
        const { data: adminSub } = await supabase
          .from('admin_telegram_subscriptions')
          .select('user_id, event_types')
          .eq('telegram_chat_id', chatId.toString())
          .single();

        if (driver && adminSub) {
          const eventCount = (adminSub.event_types as string[])?.length || 0;
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            `✅ Вы привязаны как водитель "${driver.name}"\n✅ Вы также получаете уведомления как администратор (${eventCount} типов событий)`);
        } else if (driver) {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            `✅ Вы привязаны как водитель "${driver.name}"`);
        } else if (adminSub) {
          const eventCount = (adminSub.event_types as string[])?.length || 0;
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            `✅ Вы получаете уведомления как администратор (${eventCount} типов событий)`);
        } else {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            '❌ Вы не привязаны к аккаунту');
        }
      }
      // Handle /unlink command
      else if (text === '/unlink') {
        // Unlink driver
        const { data: driver } = await supabase
          .from('drivers')
          .update({ telegram_chat_id: null })
          .eq('telegram_chat_id', chatId.toString())
          .select('name')
          .single();

        // Unlink admin
        const { data: adminSub } = await supabase
          .from('admin_telegram_subscriptions')
          .delete()
          .eq('telegram_chat_id', chatId.toString())
          .select('id')
          .single();

        if (driver || adminSub) {
          let message = '✅ Аккаунт отвязан:\n';
          if (driver) message += `• Водитель "${driver.name}"\n`;
          if (adminSub) message += `• Администратор\n`;
          message += '\nВы больше не будете получать уведомления.';
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, message);
        } else {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            '❌ Вы не были привязаны к аккаунту');
        }
      }
      else {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
          'Доступные команды:\n/link КОД - привязать аккаунт\n/status - проверить статус\n/unlink - отвязать аккаунт');
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing telegram webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleDriverLink(supabase: any, token: string, chatId: number, linkCode: string) {
  const { data: driver, error: findError } = await supabase
    .from('drivers')
    .select('id, name, telegram_link_code_expires_at')
    .eq('telegram_link_code', linkCode)
    .single();

  if (findError || !driver) {
    await sendTelegramMessage(token, chatId, 
      '❌ Неверный или истёкший код. Попросите администратора сгенерировать новый код.');
    return;
  }

  if (driver.telegram_link_code_expires_at && new Date(driver.telegram_link_code_expires_at) < new Date()) {
    await sendTelegramMessage(token, chatId, 
      '❌ Код истёк. Попросите администратора сгенерировать новый код.');
    return;
  }

  const { error: updateError } = await supabase
    .from('drivers')
    .update({ 
      telegram_chat_id: chatId.toString(),
      telegram_link_code: null,
      telegram_link_code_expires_at: null
    })
    .eq('id', driver.id);

  if (updateError) {
    console.error('Error linking driver:', updateError);
    await sendTelegramMessage(token, chatId, 
      '❌ Произошла ошибка. Попробуйте позже.');
  } else {
    await sendTelegramMessage(token, chatId, 
      `✅ Успешно! Вы привязаны как водитель "${driver.name}".\n\nТеперь вы будете получать уведомления о назначенных рейсах.`);
  }
}

async function handleDriverLinkCommand(supabase: any, token: string, chatId: number, linkCode: string) {
  const { data: driver, error: findError } = await supabase
    .from('drivers')
    .select('id, name, telegram_link_code_expires_at')
    .eq('telegram_link_code', linkCode)
    .single();

  if (findError || !driver) {
    await sendTelegramMessage(token, chatId, '❌ Неверный или истёкший код.');
    return;
  }

  if (driver.telegram_link_code_expires_at && new Date(driver.telegram_link_code_expires_at) < new Date()) {
    await sendTelegramMessage(token, chatId, '❌ Код истёк.');
    return;
  }

  const { error: updateError } = await supabase
    .from('drivers')
    .update({ 
      telegram_chat_id: chatId.toString(),
      telegram_link_code: null,
      telegram_link_code_expires_at: null
    })
    .eq('id', driver.id);

  if (updateError) {
    await sendTelegramMessage(token, chatId, '❌ Ошибка привязки.');
  } else {
    await sendTelegramMessage(token, chatId, 
      `✅ Вы привязаны как "${driver.name}". Теперь вы будете получать уведомления о рейсах.`);
  }
}

async function handleAdminLink(supabase: any, token: string, chatId: number, linkCode: string) {
  // Find profile with this link code
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, full_name, telegram_link_code_expires_at')
    .eq('telegram_link_code', linkCode)
    .single();

  if (findError || !profile) {
    await sendTelegramMessage(token, chatId, 
      '❌ Неверный или истёкший код администратора.');
    return;
  }

  if (profile.telegram_link_code_expires_at && new Date(profile.telegram_link_code_expires_at) < new Date()) {
    await sendTelegramMessage(token, chatId, '❌ Код истёк.');
    return;
  }

  // Clear the link code
  await supabase
    .from('profiles')
    .update({ 
      telegram_link_code: null,
      telegram_link_code_expires_at: null
    })
    .eq('id', profile.id);

  // Create or update admin subscription with default events
  const defaultEvents = [
    'trip_created',
    'trip_updated',
    'trip_status_changed',
    'driver_created',
    'expense_created',
    'document_uploaded'
  ];

  const { error: subError } = await supabase
    .from('admin_telegram_subscriptions')
    .upsert({
      user_id: profile.id,
      telegram_chat_id: chatId.toString(),
      event_types: defaultEvents,
      is_active: true,
    }, { onConflict: 'user_id' });

  if (subError) {
    console.error('Error creating admin subscription:', subError);
    await sendTelegramMessage(token, chatId, '❌ Ошибка привязки администратора.');
  } else {
    await sendTelegramMessage(token, chatId, 
      `✅ Успешно! Вы привязаны как администратор "${profile.full_name || 'Пользователь'}".\n\nТеперь вы будете получать уведомления о событиях системы.\n\nНастройте типы уведомлений в приложении (Настройки → Уведомления в Telegram).`);
  }
}

async function sendTelegramMessage(token: string, chatId: number | string, text: string) {
  const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send telegram message:', error);
  }
  
  return response;
}
