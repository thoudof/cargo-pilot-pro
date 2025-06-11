
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Truck, Users, FileText, Bell, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onRefresh: () => void;
}

const typeIcons = {
  trip_created: Truck,
  trip_updated: Truck,
  trip_completed: Truck,
  trip_cancelled: Truck,
  document_added: FileText,
  system: Bell
};

const typeColors = {
  trip_created: 'bg-blue-500',
  trip_updated: 'bg-yellow-500',
  trip_completed: 'bg-green-500',
  trip_cancelled: 'bg-red-500',
  document_added: 'bg-purple-500',
  system: 'bg-gray-500'
};

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  onMarkAsRead,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center p-8">
        <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Нет уведомлений</p>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-1" />
          Обновить
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-1 p-2">
        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
          const colorClass = typeColors[notification.type as keyof typeof typeColors] || 'bg-gray-500';
          
          return (
            <div
              key={notification.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${colorClass} text-white flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(notification.created_at), 'dd MMM, HH:mm', { locale: ru })}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(notification.type)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

function getTypeLabel(type: string): string {
  const labels = {
    trip_created: 'Рейс создан',
    trip_updated: 'Рейс обновлен',
    trip_completed: 'Рейс завершен',
    trip_cancelled: 'Рейс отменен',
    document_added: 'Документ',
    system: 'Система'
  };
  return labels[type as keyof typeof labels] || 'Уведомление';
}
