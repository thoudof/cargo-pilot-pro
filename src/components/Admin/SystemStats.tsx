
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Truck, 
  Building, 
  Activity, 
  MapPin, 
  Package, 
  Route,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemStatsData {
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

const statsConfig = [
  {
    key: 'totalUsers',
    title: 'Пользователей',
    icon: Users,
    colorClass: 'bg-primary/10 text-primary',
    suffix: 'в системе'
  },
  {
    key: 'totalTrips',
    title: 'Всего рейсов',
    icon: Truck,
    colorClass: 'bg-success/10 text-success',
    suffix: 'создано'
  },
  {
    key: 'activeTrips',
    title: 'Активных рейсов',
    icon: Activity,
    colorClass: 'bg-warning/10 text-warning',
    suffix: 'в пути'
  },
  {
    key: 'totalContractors',
    title: 'Контрагентов',
    icon: Building,
    colorClass: 'bg-info/10 text-info',
    suffix: 'записей'
  },
  {
    key: 'totalDrivers',
    title: 'Водителей',
    icon: Users,
    colorClass: 'bg-primary/10 text-primary',
    suffix: 'записей'
  },
  {
    key: 'totalVehicles',
    title: 'Транспорта',
    icon: Truck,
    colorClass: 'bg-destructive/10 text-destructive',
    suffix: 'единиц'
  },
  {
    key: 'totalRoutes',
    title: 'Маршрутов',
    icon: Route,
    colorClass: 'bg-success/10 text-success',
    suffix: 'записей'
  },
  {
    key: 'totalCargoTypes',
    title: 'Типов грузов',
    icon: Package,
    colorClass: 'bg-warning/10 text-warning',
    suffix: 'записей'
  },
  {
    key: 'recentActivity',
    title: 'За 24 часа',
    icon: Clock,
    colorClass: 'bg-info/10 text-info',
    suffix: 'действий'
  }
];

export const SystemStats: React.FC = () => {
  const [stats, setStats] = useState<SystemStatsData>({
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

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
      {statsConfig.map((config) => {
        const Icon = config.icon;
        const value = stats[config.key as keyof SystemStatsData];
        
        return (
          <Card 
            key={config.key} 
            className="group border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-4">
              <div className={`p-2.5 rounded-lg ${config.colorClass} w-fit mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-0.5">
                {value.toLocaleString('ru-RU')}
              </div>
              <div className="text-xs text-muted-foreground">
                {config.title}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
