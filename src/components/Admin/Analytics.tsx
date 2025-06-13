
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, TrendingUp, Users, Truck } from 'lucide-react';

interface AnalyticsData {
  dailyTrips: Array<{ date: string; trips: number; completed: number; cancelled: number }>;
  userActivity: Array<{ date: string; activeUsers: number }>;
  tripsByStatus: Array<{ status: string; count: number; color: string }>;
  monthlyGrowth: Array<{ month: string; users: number; trips: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

      // Получаем данные о рейсах по дням
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (tripsError) throw tripsError;

      // Группируем рейсы по дням
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

      // Получаем активность пользователей
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('created_at, user_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (activityError) throw activityError;

      // Группируем активность по дням
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

      // Статистика по статусам рейсов
      const statusMap = new Map();
      tripsData?.forEach(trip => {
        statusMap.set(trip.status, (statusMap.get(trip.status) || 0) + 1);
      });

      const tripsByStatus = Array.from(statusMap.entries()).map(([status, count], index) => ({
        status: getStatusLabel(status),
        count,
        color: COLORS[index % COLORS.length]
      }));

      // Месячный рост (последние 6 месяцев)
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
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Управление временным диапазоном */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Системная аналитика
            </CardTitle>
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {range === '7d' ? '7 дней' : range === '30d' ? '30 дней' : '90 дней'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Ежедневные рейсы */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Truck className="h-4 w-4 lg:h-5 lg:w-5" />
              Рейсы по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyTrips}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                  />
                  <Legend />
                  <Bar dataKey="trips" fill="#8884d8" name="Всего рейсов" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Завершено" />
                  <Bar dataKey="cancelled" fill="#ffc658" name="Отменено" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Активность пользователей */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Users className="h-4 w-4 lg:h-5 lg:w-5" />
              Активные пользователи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                  />
                  <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" name="Активные пользователи" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Рейсы по статусам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
              Распределение по статусам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.tripsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.tripsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Месячный рост */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <CalendarDays className="h-4 w-4 lg:h-5 lg:w-5" />
              Динамика роста
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" name="Новые пользователи" />
                  <Line type="monotone" dataKey="trips" stroke="#82ca9d" name="Новые рейсы" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
