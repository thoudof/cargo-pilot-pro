
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Users, Truck, Building, Activity, MapPin, Package } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalTrips: number;
  totalContractors: number;
  totalDrivers: number;
  totalVehicles: number;
  totalRoutes: number;
  totalCargoTypes: number;
  activeTrips: number;
  recentActivity: number;
}

export const SystemStats: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTrips: 0,
    totalContractors: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalRoutes: 0,
    totalCargoTypes: 0,
    activeTrips: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: tripsCount },
        { count: contractorsCount },
        { count: driversCount },
        { count: vehiclesCount },
        { count: routesCount },
        { count: cargoTypesCount },
        { count: activeTripsCount },
        { count: recentActivityCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('contractors').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('routes').select('*', { count: 'exact', head: true }),
        supabase.from('cargo_types').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('activity_logs').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalTrips: tripsCount || 0,
        totalContractors: contractorsCount || 0,
        totalDrivers: driversCount || 0,
        totalVehicles: vehiclesCount || 0,
        totalRoutes: routesCount || 0,
        totalCargoTypes: cargoTypesCount || 0,
        activeTrips: activeTripsCount || 0,
        recentActivity: recentActivityCount || 0
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Всего пользователей',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Всего рейсов',
      value: stats.totalTrips,
      icon: Truck,
      color: 'text-green-600'
    },
    {
      title: 'Активные рейсы',
      value: stats.activeTrips,
      icon: Activity,
      color: 'text-orange-600'
    },
    {
      title: 'Контрагенты',
      value: stats.totalContractors,
      icon: Building,
      color: 'text-purple-600'
    },
    {
      title: 'Водители',
      value: stats.totalDrivers,
      icon: Users,
      color: 'text-indigo-600'
    },
    {
      title: 'Транспорт',
      value: stats.totalVehicles,
      icon: Truck,
      color: 'text-red-600'
    },
    {
      title: 'Маршруты',
      value: stats.totalRoutes,
      icon: MapPin,
      color: 'text-teal-600'
    },
    {
      title: 'Типы грузов',
      value: stats.totalCargoTypes,
      icon: Package,
      color: 'text-pink-600'
    },
    {
      title: 'Активность за 24ч',
      value: stats.recentActivity,
      icon: Database,
      color: 'text-gray-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {index === 8 ? 'действий' : index === 2 ? 'в пути' : 'записей'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
