import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, Truck, Calendar, Activity, Database, Clock } from 'lucide-react';
import { ExpenseStats } from '@/components/Dashboard/ExpenseStats';

interface StatsData {
  userGrowth: Array<{ month: string; users: number }>;
  tripsByStatus: Array<{ status: string; count: number; color: string }>;
  usersByRole: Array<{ role: string; count: number; color: string }>;
  dailyActivity: Array<{ date: string; activities: number }>;
  recentMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalTrips: number;
    completedTrips: number;
    avgTripsPerUser: number;
    systemLoad: number;
  };
}

export const AdvancedStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    userGrowth: [],
    tripsByStatus: [],
    usersByRole: [],
    dailyActivity: [],
    recentMetrics: {
      totalUsers: 0,
      activeUsers: 0,
      totalTrips: 0,
      completedTrips: 0,
      avgTripsPerUser: 0,
      systemLoad: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvancedStats();
  }, []);

  const fetchAdvancedStats = async () => {
    try {
      setLoading(true);

      // Базовые метрики
      const [
        { count: totalUsers },
        { count: totalTrips },
        { count: completedTrips },
        { data: userRoles },
        { data: tripStatuses },
        { data: recentActivity }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('user_roles').select('role'),
        supabase.from('trips').select('status'),
        supabase.from('activity_logs')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Активные пользователи (вошли в систему за последние 30 дней)
      const { count: activeUsers } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Рост пользователей по месяцам
      const { data: userGrowthData } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at');

      const userGrowthByMonth = (userGrowthData || []).reduce((acc: any, user) => {
        const month = new Date(user.created_at).toLocaleDateString('ru-RU', { 
          year: 'numeric', 
          month: 'short' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const userGrowth = Object.entries(userGrowthByMonth).map(([month, users]) => ({
        month,
        users: users as number
      }));

      // Статистика по ролям
      const roleStats = (userRoles || []).reduce((acc: any, ur) => {
        acc[ur.role] = (acc[ur.role] || 0) + 1;
        return acc;
      }, {});

      const usersByRole = Object.entries(roleStats).map(([role, count], index) => ({
        role: role === 'admin' ? 'Админы' : role === 'dispatcher' ? 'Диспетчеры' : 'Водители',
        count: count as number,
        color: ['#3b82f6', '#10b981', '#f59e0b'][index % 3]
      }));

      // Статистика по статусам рейсов
      const statusStats = (tripStatuses || []).reduce((acc: any, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1;
        return acc;
      }, {});

      const tripsByStatus = Object.entries(statusStats).map(([status, count], index) => ({
        status: status === 'completed' ? 'Завершено' : 
                status === 'in_progress' ? 'В пути' : 
                status === 'cancelled' ? 'Отменено' : 'Запланировано',
        count: count as number,
        color: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'][index % 4]
      }));

      // Активность по дням
      const activityByDay = (recentActivity || []).reduce((acc: any, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString('ru-RU');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const dailyActivity = Object.entries(activityByDay)
        .slice(-7)
        .map(([date, activities]) => ({
          date,
          activities: activities as number
        }));

      setStats({
        userGrowth,
        tripsByStatus,
        usersByRole,
        dailyActivity,
        recentMetrics: {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalTrips: totalTrips || 0,
          completedTrips: completedTrips || 0,
          avgTripsPerUser: totalUsers ? Math.round((totalTrips || 0) / totalUsers * 10) / 10 : 0,
          systemLoad: Math.random() * 100 // Заглушка для нагрузки системы
        }
      });
    } catch (error) {
      console.error('Error fetching advanced stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { recentMetrics } = stats;
  const userActivityRate = recentMetrics.totalUsers ? (recentMetrics.activeUsers / recentMetrics.totalUsers * 100) : 0;
  const tripCompletionRate = recentMetrics.totalTrips ? (recentMetrics.completedTrips / recentMetrics.totalTrips * 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Активность пользователей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Активные</span>
                <span>{recentMetrics.activeUsers}/{recentMetrics.totalUsers}</span>
              </div>
              <Progress value={userActivityRate} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {userActivityRate.toFixed(1)}% активности
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-600" />
              Выполнение рейсов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Завершено</span>
                <span>{recentMetrics.completedTrips}/{recentMetrics.totalTrips}</span>
              </div>
              <Progress value={tripCompletionRate} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {tripCompletionRate.toFixed(1)}% завершено
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Средние рейсы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMetrics.avgTripsPerUser}</div>
            <div className="text-xs text-muted-foreground">на пользователя</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Нагрузка системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={recentMetrics.systemLoad} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {recentMetrics.systemLoad.toFixed(1)}% использования
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Добавляем статистику по расходам */}
      <ExpenseStats stats={stats} formatCurrency={formatCurrency} />

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Рост пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Активность за неделю</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activities" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Пользователи по ролям</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.usersByRole}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ role, count }) => `${role}: ${count}`}
                >
                  {stats.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Рейсы по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.tripsByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {stats.tripsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
