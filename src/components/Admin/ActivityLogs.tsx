import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Filter, Search, User, X, Clock, Globe, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

const LOGS_PER_PAGE = 20;

const actionConfig: Record<string, { label: string; className: string }> = {
  login: { label: 'Вход в систему', className: 'bg-success/10 text-success border-success/20' },
  logout: { label: 'Выход из системы', className: 'bg-muted text-muted-foreground border-border' },
  create: { label: 'Создание', className: 'bg-primary/10 text-primary border-primary/20' },
  update: { label: 'Обновление', className: 'bg-info/10 text-info border-info/20' },
  delete: { label: 'Удаление', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  navigation: { label: 'Навигация', className: 'bg-muted text-muted-foreground border-border' },
  view: { label: 'Просмотр', className: 'bg-muted text-muted-foreground border-border' },
  export: { label: 'Экспорт', className: 'bg-warning/10 text-warning border-warning/20' },
  import: { label: 'Импорт', className: 'bg-warning/10 text-warning border-warning/20' },
  search: { label: 'Поиск', className: 'bg-muted text-muted-foreground border-border' },
  filter: { label: 'Фильтрация', className: 'bg-muted text-muted-foreground border-border' }
};

const entityLabels: Record<string, string> = {
  trip: 'Рейс',
  contractor: 'Контрагент',
  driver: 'Водитель',
  vehicle: 'Транспорт',
  route: 'Маршрут',
  cargo_type: 'Тип груза',
  auth: 'Аутентификация',
  page: 'Страница',
  user: 'Пользователь',
  notification: 'Уведомление'
};

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filter, userSearch, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    
    try {
      const offset = (currentPage - 1) * LOGS_PER_PAGE;
      
      let countQuery = supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true });

      if (filter !== 'all') {
        countQuery = countQuery.eq('action', filter);
      }

      if (userSearch.trim()) {
        countQuery = countQuery.or(`details->>user_email.ilike.%${userSearch}%,details->>user_name.ilike.%${userSearch}%`);
      }

      const { count } = await countQuery;
      setTotalLogs(count || 0);

      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + LOGS_PER_PAGE - 1);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      if (userSearch.trim()) {
        query = query.or(`details->>user_email.ilike.%${userSearch}%,details->>user_name.ilike.%${userSearch}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('ActivityLogs: Exception while fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = (log: ActivityLog) => {
    if (!log.details) return 'Неизвестный пользователь';
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      return details.user_name || details.user_email || 'Неизвестный пользователь';
    } catch {
      return 'Неизвестный пользователь';
    }
  };

  const getUserEmail = (log: ActivityLog) => {
    if (!log.details) return null;
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      return details.user_email || null;
    } catch {
      return null;
    }
  };

  const getDetailedDescription = (log: ActivityLog) => {
    const action = actionConfig[log.action]?.label || log.action;
    const entityType = entityLabels[log.entity_type || ''] || log.entity_type || 'Система';
    
    if (log.details) {
      try {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        if (log.action === 'navigation' && details.page) {
          return `Переход на страницу: ${details.page}`;
        }
        if (['create', 'update', 'delete'].includes(log.action) && log.entity_id) {
          return `${action} ${entityType.toLowerCase()} (ID: ${log.entity_id.substring(0, 8)}...)`;
        }
        return `${action} - ${entityType}`;
      } catch {
        return `${action} - ${entityType}`;
      }
    }
    return `${action} - ${entityType}`;
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Неизвестно';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Другой';
  };

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Логи активности
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по пользователю..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-48 h-9"
              />
              {userSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setUserSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <Select value={filter} onValueChange={(value) => {
              setFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-40 h-9">
                <Filter className="h-4 w-4 mr-2" />
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
        <p className="text-sm text-muted-foreground mt-2">
          Показано {logs.length} из {totalLogs} записей • Страница {currentPage} из {totalPages || 1}
          {userSearch && <span className="ml-2">• Поиск: "{userSearch}"</span>}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="font-semibold">Время</TableHead>
                <TableHead className="font-semibold">Пользователь</TableHead>
                <TableHead className="font-semibold">Действие</TableHead>
                <TableHead className="font-semibold">Описание</TableHead>
                <TableHead className="font-semibold">Браузер</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const config = actionConfig[log.action] || { label: log.action, className: 'bg-muted text-muted-foreground border-border' };
                
                return (
                  <TableRow key={log.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {new Date(log.created_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-muted">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-sm font-medium truncate">{getUserInfo(log)}</p>
                          {getUserEmail(log) && (
                            <p className="text-xs text-muted-foreground truncate">{getUserEmail(log)}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${config.className} border text-xs`}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px]">
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{getDetailedDescription(log)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        {formatUserAgent(log.user_agent)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{userSearch ? `Логи для "${userSearch}" не найдены` : 'Логи активности не найдены'}</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">Всего записей: {totalLogs}</p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">1</PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && <PaginationEllipsis />}
                  </>
                )}
                
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
