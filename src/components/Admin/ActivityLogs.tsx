
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  user_id: string;
  created_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'default';
      case 'logout': return 'secondary';
      case 'create': return 'default';
      case 'update': return 'outline';
      case 'delete': return 'destructive';
      case 'navigation': return 'secondary';
      default: return 'outline';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return 'Вход';
      case 'logout': return 'Выход';
      case 'create': return 'Создание';
      case 'update': return 'Обновление';
      case 'delete': return 'Удаление';
      case 'navigation': return 'Навигация';
      default: return action;
    }
  };

  const getEntityTypeLabel = (entityType: string | null) => {
    if (!entityType) return 'Не указано';
    switch (entityType) {
      case 'trip': return 'Рейс';
      case 'contractor': return 'Контрагент';
      case 'driver': return 'Водитель';
      case 'vehicle': return 'Транспорт';
      case 'route': return 'Маршрут';
      case 'cargo_type': return 'Тип груза';
      default: return entityType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Логи активности
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все действия</SelectItem>
                <SelectItem value="login">Вход</SelectItem>
                <SelectItem value="logout">Выход</SelectItem>
                <SelectItem value="create">Создание</SelectItem>
                <SelectItem value="update">Обновление</SelectItem>
                <SelectItem value="delete">Удаление</SelectItem>
                <SelectItem value="navigation">Навигация</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Тип объекта</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(log.created_at).toLocaleString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getEntityTypeLabel(log.entity_type)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.user_id?.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details).substring(0, 100) + '...' : 'Нет деталей'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Логи активности не найдены
          </div>
        )}
      </CardContent>
    </Card>
  );
};
