
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users } from 'lucide-react';
import { supabaseService } from '@/services/supabaseService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeTrips: 0,
    totalTrips: 0,
    contractors: 0,
    drivers: 0,
    vehicles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await supabaseService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Статистические карточки */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow aspect-square sm:aspect-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Активные рейсы</CardTitle>
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.activeTrips}</div>
            <p className="text-xs text-muted-foreground leading-tight">из {stats.totalTrips} всего</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow aspect-square sm:aspect-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Контрагенты</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.contractors}</div>
            <p className="text-xs text-muted-foreground leading-tight">всего</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow aspect-square sm:aspect-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Водители</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.drivers}</div>
            <p className="text-xs text-muted-foreground leading-tight">в базе</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow aspect-square sm:aspect-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Транспорт</CardTitle>
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.vehicles}</div>
            <p className="text-xs text-muted-foreground leading-tight">в парке</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Секция рейсов */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Truck className="h-5 w-5" />
            <span>Рейсы</span>
          </CardTitle>
          <button className="text-sm text-primary hover:underline">
            Показать все
          </button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            У вас пока нет активных рейсов
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export { Dashboard };
export default Dashboard;
