
import React, { useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationManagerProps {
  userId?: string;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ userId }) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    initializePushNotifications();
  }, [userId]);

  const initializePushNotifications = async () => {
    try {
      // Проверяем поддержку уведомлений
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Push notifications not supported');
        return;
      }

      // Запрашиваем разрешение на уведомления
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await registerServiceWorker();
        await subscribeToPushNotifications();
        
        toast({
          title: 'Уведомления включены',
          description: 'Вы будете получать PUSH-уведомления о важных событиях'
        });
      } else if (permission === 'denied') {
        console.log('Push notifications denied');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Генерируем подписку на PUSH-уведомления
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey())
      });

      // Сохраняем токен в базе данных
      const token = btoa(JSON.stringify(subscription));
      await supabaseService.savePushToken(token, 'web');
      
      console.log('Push subscription saved:', subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getVapidPublicKey = () => {
    // В продакшене этот ключ должен быть настоящим VAPID ключом
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YrrC6lpOKssA5w5rF_oa_SJlLqWgdOX3lLk7z2w2C8dZSCYbSBMEKH8';
  };

  return null; // Этот компонент не рендерит UI
};
