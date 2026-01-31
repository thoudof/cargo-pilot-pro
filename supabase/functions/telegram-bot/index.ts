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
    const body = await req.json();
    console.log('Telegram webhook received:', JSON.stringify(body));

    // Handle Telegram webhook (incoming messages from bot)
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text || '';
      const username = body.message.from?.username || '';

      // Handle /start command with link code
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const linkCode = parts[1];
          
          // Find driver with this link code
          const { data: driver, error: findError } = await supabase
            .from('drivers')
            .select('id, name, telegram_link_code_expires_at')
            .eq('telegram_link_code', linkCode)
            .single();

          if (findError || !driver) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
              '❌ Неверный или истёкший код. Попросите администратора сгенерировать новый код.');
            return new Response(JSON.stringify({ ok: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Check if code expired
          if (driver.telegram_link_code_expires_at && new Date(driver.telegram_link_code_expires_at) < new Date()) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
              '❌ Код истёк. Попросите администратора сгенерировать новый код.');
            return new Response(JSON.stringify({ ok: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Link driver to telegram chat
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
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
              '❌ Произошла ошибка. Попробуйте позже.');
          } else {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
              `✅ Успешно! Вы привязаны как водитель "${driver.name}".\n\nТеперь вы будете получать уведомления о назначенных рейсах.`);
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
          
          const { data: driver, error: findError } = await supabase
            .from('drivers')
            .select('id, name, telegram_link_code_expires_at')
            .eq('telegram_link_code', linkCode)
            .single();

          if (findError || !driver) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
              '❌ Неверный или истёкший код.');
            return new Response(JSON.stringify({ ok: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (driver.telegram_link_code_expires_at && new Date(driver.telegram_link_code_expires_at) < new Date()) {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
              '❌ Код истёк.');
            return new Response(JSON.stringify({ ok: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
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
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, '❌ Ошибка привязки.');
          } else {
            await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
              `✅ Вы привязаны как "${driver.name}". Теперь вы будете получать уведомления о рейсах.`);
          }
        } else {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            'Используйте команду в формате: /link КОД');
        }
      }
      // Handle /status command
      else if (text === '/status') {
        const { data: driver } = await supabase
          .from('drivers')
          .select('name')
          .eq('telegram_chat_id', chatId.toString())
          .single();

        if (driver) {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            `✅ Вы привязаны как водитель "${driver.name}"`);
        } else {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            '❌ Вы не привязаны к аккаунту водителя');
        }
      }
      // Handle /unlink command
      else if (text === '/unlink') {
        const { data: driver, error } = await supabase
          .from('drivers')
          .update({ telegram_chat_id: null })
          .eq('telegram_chat_id', chatId.toString())
          .select('name')
          .single();

        if (driver) {
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, 
            `✅ Аккаунт "${driver.name}" отвязан. Вы больше не будете получать уведомления.`);
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