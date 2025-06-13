
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Server, Database, Clock, Cpu, HardDrive, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SystemMetrics {
  dbResponseTime: number;
  dbConnections: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;
  lastUpdated: Date;
}

interface PerformanceData {
  timestamp: string;
  responseTime: number;
  connections: number;
  load: number;
}

export const SystemMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    dbResponseTime: 0,
    dbConnections: 0,
    systemLoad: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    uptime: 0,
    lastUpdated: new Date()
  });
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 30000); // Обновляем каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const fetchSystemMetrics = async () => {
    const startTime = Date.now();
    
    try {
      // Тестируем скорость отклика БД
      const dbStartTime = Date.now();
      const { data: dbTest } = await supabase.from('profiles').select('count').limit(1);
      const dbResponseTime = Date.now() - dbStartTime;

      // Получаем статистику по активным соединениям (приблизительно)
      const { data: activeUsers } = await supabase
        .from('activity_logs')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // последние 5 минут
        .order('created_at', { ascending: false });

      const uniqueActiveUsers = new Set(activeUsers?.map(log => log.user_id)).size;

      // Симулируем системные метрики (в реальном приложении это будет получаться с сервера)
      const newMetrics: SystemMetrics = {
        dbResponseTime,
        dbConnections: uniqueActiveUsers,
        systemLoad: Math.random() * 100, // 0-100%
        memoryUsage: 45 + Math.random() * 30, // 45-75%
        diskUsage: 60 + Math.random() * 20, // 60-80%
        networkLatency: 10 + Math.random() * 40, // 10-50ms
        uptime: Date.now() - new Date('2024-01-01').getTime(), // время с запуска
        lastUpdated: new Date()
      };

      setMetrics(newMetrics);

      // Добавляем данные в историю производительности
      const newPerformanceData: PerformanceData = {
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        responseTime: dbResponseTime,
        connections: uniqueActiveUsers,
        load: newMetrics.systemLoad
      };

      setPerformanceHistory(prev => {
        const updated = [...prev, newPerformanceData];
        return updated.slice(-20); // Храним последние 20 точек
      });

    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemMetrics();
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}д ${hours}ч ${minutes}м`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (value >= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <div className="h-2 w-2 bg-green-600 rounded-full"></div>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Заголовок с кнопкой обновления */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Мониторинг системы
            </CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Обновлено: {metrics.lastUpdated.toLocaleTimeString('ru-RU')}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Отклик БД
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.dbResponseTime}ms</div>
              {getStatusIcon(metrics.dbResponseTime, { warning: 100, critical: 500 })}
            </div>
            <p className={`text-xs ${getStatusColor(metrics.dbResponseTime, { warning: 100, critical: 500 })}`}>
              {metrics.dbResponseTime < 100 ? 'Отлично' : metrics.dbResponseTime < 500 ? 'Нормально' : 'Медленно'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Активные соединения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.dbConnections}</div>
              {getStatusIcon(metrics.dbConnections, { warning: 50, critical: 100 })}
            </div>
            <p className={`text-xs ${getStatusColor(metrics.dbConnections, { warning: 50, critical: 100 })}`}>
              Пользователей онлайн
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Нагрузка системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.systemLoad.toFixed(1)}%</div>
              {getStatusIcon(metrics.systemLoad, { warning: 70, critical: 90 })}
            </div>
            <p className={`text-xs ${getStatusColor(metrics.systemLoad, { warning: 70, critical: 90 })}`}>
              Загрузка CPU
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Использование памяти
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
              {getStatusIcon(metrics.memoryUsage, { warning: 80, critical: 95 })}
            </div>
            <p className={`text-xs ${getStatusColor(metrics.memoryUsage, { warning: 80, critical: 95 })}`}>
              RAM используется
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Использование диска</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Занято</span>
                <span>{metrics.diskUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.diskUsage > 90 ? 'bg-red-500' : 
                    metrics.diskUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${metrics.diskUsage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Сетевая задержка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.networkLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">Средний пинг</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Время работы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatUptime(metrics.uptime)}</div>
            <p className="text-xs text-muted-foreground">Система работает</p>
          </CardContent>
        </Card>
      </div>

      {/* Графики производительности */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Время отклика БД</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Время отклика (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Нагрузка системы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="load" stroke="#82ca9d" fill="#82ca9d" name="Нагрузка (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
