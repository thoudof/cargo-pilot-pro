
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Circle, Check } from 'lucide-react';
import { NotificationList } from './NotificationList';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_entity_id?: string;
  related_entity_type?: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    
    // Подписка на изменения уведомлений в реальном времени
    const channel = supabaseService.supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabaseService.supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabaseService.markNotificationAsRead(notificationId);
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
      await supabaseService.markAllNotificationsAsRead();
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
          notifications={notifications}
          loading={loading}
          onMarkAsRead={markAsRead}
          onRefresh={loadNotifications}
        />
      </PopoverContent>
    </Popover>
  );
};
