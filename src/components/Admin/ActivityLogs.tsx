
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

const LOGS_PER_PAGE = 20;

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filter, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    console.log('ActivityLogs: Fetching logs with filter:', filter, 'page:', currentPage);
    
    try {
      const offset = (currentPage - 1) * LOGS_PER_PAGE;
      
      // Получаем общее количество записей для пагинации
      let countQuery = supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true });

      if (filter !== 'all') {
        countQuery = countQuery.eq('action', filter);
      }

      const { count } = await countQuery;
      setTotalLogs(count || 0);

      // Получаем записи для текущей страницы
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + LOGS_PER_PAGE - 1);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('ActivityLogs: Error fetching logs:', error);
        throw error;
      }
      
      console.log('ActivityLogs: Successfully fetched', data?.length || 0, 'logs');
      setLogs(data || []);
    } catch (error) {
      console.error('ActivityLogs: Exception while fetching logs:', error);
      setLogs([]);
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
    const labels: Record<string, string> = {
      'login': 'Вход в систему',
      'logout': 'Выход из системы',
      'create': 'Создание записи',
      'update': 'Обновление записи',
      'delete': 'Удаление записи',
      'navigation': 'Переход по страницам',
      'view': 'Просмотр данных',
      'export': 'Экспорт данных',
      'import': 'Импорт данных',
      'search': 'Поиск данных',
      'filter': 'Фильтрация данных'
    };
    return labels[action.toLowerCase()] || action;
  };

  const getEntityTypeLabel = (entityType: string | null) => {
    if (!entityType) return 'Система';
    
    const labels: Record<string, string> = {
      'trip': 'Рейс',
      'contractor': 'Контрагент',
      'driver': 'Водитель',
      'vehicle': 'Транспорт',
      'route': 'Маршрут',
      'cargo_type': 'Тип груза',
      'auth': 'Аутентификация',
      'page': 'Страница',
      'user': 'Пользователь',
      'notification': 'Уведомление'
    };
    return labels[entityType] || entityType;
  };

  const getDetailedDescription = (log: ActivityLog) => {
    const action = getActionLabel(log.action);
    const entityType = getEntityTypeLabel(log.entity_type);
    
    if (log.details) {
      try {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        
        // Специальная обработка для навигации
        if (log.action === 'navigation' && details.page) {
          return `Переход на страницу: ${details.page}`;
        }
        
        // Специальная обработка для создания/обновления/удаления
        if (['create', 'update', 'delete'].includes(log.action) && log.entity_id) {
          return `${action} ${entityType.toLowerCase()} (ID: ${log.entity_id.substring(0, 8)}...)`;
        }
        
        // Общая обработка других действий
        return `${action} - ${entityType}`;
      } catch (error) {
        console.warn('ActivityLogs: Error parsing details:', error);
        return `${action} - ${entityType}`;
      }
    }
    
    return `${action} - ${entityType}`;
  };

  const formatDetails = (details: any) => {
    if (!details) return 'Нет дополнительной информации';
    
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      const formatted = Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return formatted.length > 100 ? formatted.substring(0, 100) + '...' : formatted;
    } catch (error) {
      return 'Некорректные данные';
    }
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Неизвестно';
    
    // Упрощенное определение браузера
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Другой браузер';
  };

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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
            Логи активности пользователей
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filter} onValueChange={(value) => {
              setFilter(value);
              setCurrentPage(1); // Сбрасываем на первую страницу при смене фильтра
            }}>
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
                <SelectItem value="view">Просмотр</SelectItem>
                <SelectItem value="export">Экспорт</SelectItem>
                <SelectItem value="search">Поиск</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Показано {logs.length} из {totalLogs} записей (страница {currentPage} из {totalPages})
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата и время</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Браузер</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(log.created_at).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {getDetailedDescription(log)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatUserAgent(log.user_agent)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-xs text-muted-foreground truncate">
                      {formatDetails(log.details)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {filter === 'all' 
              ? 'Логи активности не найдены' 
              : `Логи с действием "${getActionLabel(filter)}" не найдены`
            }
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Всего записей: {totalLogs}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Показываем первую страницу */}
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && <PaginationEllipsis />}
                  </>
                )}
                
                {/* Показываем текущую страницу и соседние */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }).filter(Boolean)}
                
                {/* Показываем последнюю страницу */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
