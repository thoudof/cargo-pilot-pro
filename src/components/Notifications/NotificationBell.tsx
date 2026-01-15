
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, History } from 'lucide-react';
import { NotificationList } from './NotificationList';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const loadNotifications = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (mountedRef.current) {
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Загружаем уведомления при монтировании
    loadNotifications();

    // Создаем функцию для очистки канала
    const cleanupChannel = () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
        channelRef.current = null;
      }
    };

    // Очищаем существующий канал перед созданием нового
    cleanupChannel();

    // Создаем новый канал с уникальным именем
    const channelName = `notifications-${Date.now()}-${Math.random()}`;
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications'
        }, (payload) => {
          console.log('Notification change:', payload);
          if (mountedRef.current) {
            loadNotifications();
          }
        })
        .subscribe((status) => {
          console.log('Channel subscription status:', status);
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Error creating channel:', error);
    }

    // Функция очистки при размонтировании
    return () => {
      mountedRef.current = false;
      cleanupChannel();
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить уведомление как прочитанное',
        variant: 'destructive'
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;
      await loadNotifications();
      toast({
        title: 'Готово',
        description: 'Все уведомления отмечены как прочитанные'
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить все уведомления как прочитанные',
        variant: 'destructive'
      });
    }
  };

  // Преобразуем notifications для NotificationList
  const notificationsForList = notifications.map(n => ({
    ...n,
    is_read: n.read
  }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Уведомления</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="h-auto p-1 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Прочитать все
              </Button>
            )}
          </div>
        </div>
        <NotificationList
          notifications={notificationsForList}
          loading={loading}
          onMarkAsRead={markAsRead}
          onRefresh={loadNotifications}
        />
        <div className="border-t p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start" 
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/notifications">
              <History className="h-4 w-4 mr-2" />
              Вся история уведомлений
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
