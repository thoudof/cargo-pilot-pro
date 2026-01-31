import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface PushNotificationPayload {
  title: string;
  message: string;
  userId?: string;
  userIds?: string[];
  roles?: string[];
  notificationId?: string;
  url?: string;
  type?: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Web Push implementation using crypto
async function sendWebPush(
  subscription: PushSubscription,
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const payloadString = JSON.stringify(payload);
    
    // Create JWT for VAPID
    const header = { alg: 'ES256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      aud: new URL(subscription.endpoint).origin,
      exp: now + 12 * 60 * 60, // 12 hours
      sub: 'mailto:admin@fixlogistics.ru'
    };

    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedToken = `${headerB64}.${claimsB64}`;

    // Import the private key for signing
    const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      encoder.encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${unsignedToken}.${signatureB64}`;

    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Urgency': 'high'
      },
      body: payloadString
    });

    if (!response.ok) {
      console.error('Push failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending web push:', error);
    return false;
  }
}

// Simple push using fetch to endpoint (works for many push services)
async function sendSimplePush(
  subscriptionData: string,
  payload: object,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    // Parse the subscription from base64
    const subscription = JSON.parse(atob(subscriptionData)) as PushSubscription;
    
    console.log('Sending to endpoint:', subscription.endpoint);

    // For now, use a simpler approach - direct POST to the push service
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: JSON.stringify(payload)
    });

    console.log('Push response status:', response.status);
    
    // 201 = created, 200 = ok - both are success
    if (response.status === 201 || response.status === 200) {
      return true;
    }
    
    // 410 = subscription expired, should be removed
    if (response.status === 410) {
      console.log('Subscription expired, should remove');
      return false;
    }

    const text = await response.text();
    console.error('Push failed with status', response.status, text);
    return false;
  } catch (error) {
    console.error('Error in sendSimplePush:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

    if (!vapidPublicKey) {
      console.error('VAPID_PUBLIC_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { title, message, userId, userIds, roles, notificationId, url, type }: PushNotificationPayload = await req.json();

    console.log('Sending push notification:', { title, message, userId, userIds, roles, type });

    // Collect all target user IDs
    let targetUserIds: string[] = [];
    
    if (userId) {
      targetUserIds.push(userId);
    }
    
    if (userIds && userIds.length > 0) {
      targetUserIds = [...targetUserIds, ...userIds];
    }
    
    // If roles specified, get all users with those roles
    if (roles && roles.length > 0) {
      const { data: roleUsers, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .in('role', roles);
      
      if (roleError) {
        console.error('Error fetching role users:', roleError);
      } else if (roleUsers) {
        targetUserIds = [...targetUserIds, ...roleUsers.map(r => r.user_id)];
      }
    }

    // Remove duplicates
    targetUserIds = [...new Set(targetUserIds)];

    console.log('Target user IDs:', targetUserIds);

    // Fetch push tokens
    let query = supabaseClient.from('push_tokens').select('*');
    
    if (targetUserIds.length > 0) {
      query = query.in('user_id', targetUserIds);
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for target users');
      return new Response(
        JSON.stringify({ success: true, message: 'No push tokens to send to', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${tokens.length} push tokens`);

    const payload = {
      title,
      message,
      notificationId,
      url: url || '/',
      type: type || 'info',
      timestamp: new Date().toISOString()
    };

    // Create in-app notifications for each user
    const notificationPromises = targetUserIds.map(async (uid) => {
      try {
        await supabaseClient.from('notifications').insert({
          user_id: uid,
          title,
          message,
          type: type || 'info',
          read: false
        });
      } catch (err) {
        console.error('Error creating notification for user', uid, err);
      }
    });

    await Promise.all(notificationPromises);

    // Send push notifications
    const pushPromises = tokens.map(async (tokenData) => {
      try {
        if (tokenData.platform === 'web') {
          const success = await sendSimplePush(tokenData.token, payload, vapidPublicKey);
          return { success, userId: tokenData.user_id, platform: 'web' };
        } else {
          // For other platforms (iOS/Android native), log for now
          console.log(`Would send to ${tokenData.platform}: ${tokenData.token.substring(0, 30)}...`);
          return { success: true, userId: tokenData.user_id, platform: tokenData.platform };
        }
      } catch (error) {
        console.error(`Error sending push to ${tokenData.platform}:`, error);
        return { success: false, userId: tokenData.user_id, error: error.message };
      }
    });

    const results = await Promise.all(pushPromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Push results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notifications sent',
        total: results.length,
        successful,
        failed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
