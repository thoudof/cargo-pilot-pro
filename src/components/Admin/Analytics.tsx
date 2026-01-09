
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, TrendingUp, Users, Truck, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  dailyTrips: Array<{ date: string; trips: number; completed: number; cancelled: number }>;
  userActivity: Array<{ date: string; activeUsers: number }>;
  tripsByStatus: Array<{ status: string; count: number; color: string }>;
  monthlyGrowth: Array<{ month: string; users: number; trips: number }>;
}

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
};

const STATUS_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    dailyTrips: [],
    userActivity: [],
    tripsByStatus: [],
    monthlyGrowth: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (tripsError) throw tripsError;

      const dailyTripsMap = new Map();
      tripsData?.forEach(trip => {
        const date = new Date(trip.created_at).toISOString().split('T')[0];
        if (!dailyTripsMap.has(date)) {
          dailyTripsMap.set(date, { date, trips: 0, completed: 0, cancelled: 0 });
        }
        const dayData = dailyTripsMap.get(date);
        dayData.trips++;
        if (trip.status === 'completed') dayData.completed++;
        if (trip.status === 'cancelled') dayData.cancelled++;
      });

      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('created_at, user_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (activityError) throw activityError;

      const dailyActivityMap = new Map();
      activityData?.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (!dailyActivityMap.has(date)) {
          dailyActivityMap.set(date, new Set());
        }
        dailyActivityMap.get(date).add(log.user_id);
      });

      const userActivity = Array.from(dailyActivityMap.entries()).map(([date, userSet]) => ({
        date,
        activeUsers: userSet.size
      }));

      const statusMap = new Map();
      tripsData?.forEach(trip => {
        statusMap.set(trip.status, (statusMap.get(trip.status) || 0) + 1);
      });

      const tripsByStatus = Array.from(statusMap.entries()).map(([status, count], index) => ({
        status: getStatusLabel(status),
        count,
        color: STATUS_COLORS[index % STATUS_COLORS.length]
      }));

      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data: monthTrips } = await supabase
          .from('trips')
          .select('id')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { data: monthUsers } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        monthlyData.push({
          month: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
          users: monthUsers?.length || 0,
          trips: monthTrips?.length || 0
        });
      }

      setData({
        dailyTrips: Array.from(dailyTripsMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
        userActivity: userActivity.sort((a, b) => a.date.localeCompare(b.date)),
        tripsByStatus,
        monthlyGrowth: monthlyData
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'planned': 'Запланированы',
      'in_progress': 'В пути',
      'completed': 'Завершены',
      'cancelled': 'Отменены'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              Системная аналитика
            </CardTitle>
            <div className="flex gap-2">
              {[
                { value: '7d', label: '7 дней' },
                { value: '30d', label: '30 дней' },
                { value: '90d', label: '90 дней' }
              ].map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range.value as any)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trips */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-success/10">
                <Truck className="h-4 w-4 text-success" />
              </div>
              Рейсы по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyTrips}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={11}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    className="fill-muted-foreground"
                  />
                  <YAxis fontSize={11} className="fill-muted-foreground" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="trips" fill="#3b82f6" name="Всего рейсов" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#22c55e" name="Завершено" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" fill="#f59e0b" name="Отменено" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Активные пользователи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={11}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    className="fill-muted-foreground"
                  />
                  <YAxis fontSize={11} className="fill-muted-foreground" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activeUsers" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    name="Активные пользователи" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-info/10">
                <TrendingUp className="h-4 w-4 text-info" />
              </div>
              Распределение по статусам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.tripsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="count"
                    paddingAngle={2}
                  >
                    {data.tripsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-warning/10">
                <CalendarDays className="h-4 w-4 text-warning" />
              </div>
              Динамика роста
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" fontSize={11} className="fill-muted-foreground" />
                  <YAxis fontSize={11} className="fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    name="Новые пользователи" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="trips" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2 }}
                    name="Новые рейсы" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
