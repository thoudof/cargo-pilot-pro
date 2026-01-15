import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Truck, 
  FileText, 
  RefreshCw, 
  Check, 
  CheckCheck,
  Search,
  Filter,
  Trash2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  user_id: string;
}

const typeConfig = {
  trip_created: { label: 'Рейс создан', icon: Truck, color: 'bg-blue-500' },
  trip_updated: { label: 'Рейс обновлён', icon: Truck, color: 'bg-yellow-500' },
  trip_completed: { label: 'Рейс завершён', icon: Truck, color: 'bg-green-500' },
  trip_cancelled: { label: 'Рейс отменён', icon: Truck, color: 'bg-red-500' },
  document_added: { label: 'Документ добавлен', icon: FileText, color: 'bg-purple-500' },
  system: { label: 'Системное', icon: Bell, color: 'bg-muted-foreground' }
};

export const NotificationHistory: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter === 'read') {
        query = query.eq('read', true);
      } else if (statusFilter === 'unread') {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];
      
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filteredData = filteredData.filter(n => 
          n.title.toLowerCase().includes(search) || 
          n.message.toLowerCase().includes(search)
        );
      }

      setNotifications(filteredData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить историю уведомлений',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery, toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить уведомление',
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
      console.error('Failed to mark all as read:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить все уведомления',
        variant: 'destructive'
      });
    }
  };

  const deleteAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('read', true);

      if (error) throw error;
      await loadNotifications();
      toast({
        title: 'Готово',
        description: 'Прочитанные уведомления удалены'
      });
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить уведомления',
        variant: 'destructive'
      });
    }
  };

  const getTypeConfig = (type: string) => {
    return typeConfig[type as keyof typeof typeConfig] || typeConfig.system;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>История уведомлений</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Bell className="h-3 w-3" />
              {notifications.length} всего
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {unreadCount} непрочитанных
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по уведомлениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="trip_created">Рейс создан</SelectItem>
                <SelectItem value="trip_updated">Рейс обновлён</SelectItem>
                <SelectItem value="trip_completed">Рейс завершён</SelectItem>
                <SelectItem value="trip_cancelled">Рейс отменён</SelectItem>
                <SelectItem value="document_added">Документ</SelectItem>
                <SelectItem value="system">Системное</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="unread">Непрочитанные</SelectItem>
                <SelectItem value="read">Прочитанные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Прочитать все ({unreadCount})
            </Button>
          )}
          
          {readCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить прочитанные ({readCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить прочитанные уведомления?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Все прочитанные уведомления будут удалены навсегда.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAllRead}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Notifications Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Уведомления не найдены</p>
            {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <Button
                variant="link"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Тип</TableHead>
                  <TableHead>Уведомление</TableHead>
                  <TableHead className="w-[150px]">Дата</TableHead>
                  <TableHead className="w-[100px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => {
                  const config = getTypeConfig(notification.type);
                  const Icon = config.icon;
                  
                  return (
                    <TableRow 
                      key={notification.id}
                      className={!notification.read ? 'bg-primary/5' : ''}
                    >
                      <TableCell>
                        <div className={`p-2 rounded-full ${config.color} text-white w-fit`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">Новое</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell className="text-right">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
