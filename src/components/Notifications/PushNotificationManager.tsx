import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';

interface PushNotificationManagerProps {
  userId?: string;
  showButton?: boolean;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ 
  userId, 
  showButton = false 
}) => {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    checkSupport();
    fetchVapidKey();
  }, []);

  useEffect(() => {
    if (userId && vapidPublicKey) {
      checkSubscriptionStatus();
    }
  }, [userId, vapidPublicKey]);

  const checkSupport = () => {
    const supported = 'Notification' in window && 
                      'serviceWorker' in navigator && 
                      'PushManager' in window;
    setIsSupported(supported);
    
    if (!supported) {
      console.log('Push notifications not supported in this browser');
    }
  };

  const fetchVapidKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      
      if (error) {
        console.error('Error fetching VAPID key:', error);
        return;
      }
      
      if (data?.vapidPublicKey) {
        setVapidPublicKey(data.vapidPublicKey);
      }
    } catch (error) {
      console.error('Failed to fetch VAPID key:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  };

  const subscribe = useCallback(async () => {
    if (!userId || !vapidPublicKey) {
      console.log('Cannot subscribe: missing userId or VAPID key');
      return;
    }

    setIsLoading(true);
    
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: 'Уведомления заблокированы',
          description: 'Разрешите уведомления в настройках браузера',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      console.log('Service worker registered');

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Push subscription created:', subscription.endpoint);

      // Save subscription to database
      const token = btoa(JSON.stringify(subscription.toJSON()));
      
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          platform: 'web'
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        // Try insert if upsert fails
        const { error: insertError } = await supabase
          .from('push_tokens')
          .insert({
            user_id: userId,
            token,
            platform: 'web'
          });
        
        if (insertError) {
          throw insertError;
        }
      }

      setIsSubscribed(true);
      
      toast({
        title: 'Уведомления включены',
        description: 'Вы будете получать push-уведомления о важных событиях'
      });

    } catch (error) {
      console.error('Subscription failed:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключить push-уведомления',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, vapidPublicKey, toast]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Remove from database
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('platform', 'web');

      setIsSubscribed(false);
      
      toast({
        title: 'Уведомления отключены',
        description: 'Вы больше не будете получать push-уведомления'
      });

    } catch (error) {
      console.error('Unsubscribe failed:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить уведомления',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  // Auto-subscribe if not subscribed and permission already granted
  useEffect(() => {
    if (userId && vapidPublicKey && isSupported && !isSubscribed) {
      if (Notification.permission === 'granted') {
        subscribe();
      }
    }
  }, [userId, vapidPublicKey, isSupported, isSubscribed, subscribe]);

  if (!showButton || !isSupported) {
    return null;
  }

  return (
    <Button
      variant={isSubscribed ? 'outline' : 'default'}
      size="sm"
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isSubscribed ? 'Отключить уведомления' : 'Включить уведомления'}
    </Button>
  );
};
