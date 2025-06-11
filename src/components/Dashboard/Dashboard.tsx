
import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/Layout/MobileLayout';
import { ContractorList } from '@/components/Contractors/ContractorList';
import { TripList } from '@/components/Trips/TripList';
import { DriverList } from '@/components/Drivers/DriverList';
import { VehicleList } from '@/components/Vehicles/VehicleList';
import { RouteList } from '@/components/Routes/RouteList';
import { CargoTypeList } from '@/components/CargoTypes/CargoTypeList';
import { TripsOverview } from './TripsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, FileText, BarChart3, Calendar, Route, Package } from 'lucide-react';
import { supabaseService } from '@/services/supabaseService';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const DashboardHome = ({ onNavigateToTrips }: { onNavigateToTrips: () => void }) => {
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
      {/* Статистические карточки - мобильная сетка 2x2, планшет/десктоп адаптивно */}
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
      
      {/* Обзор рейсов */}
      <TripsOverview onNavigateToTrips={onNavigateToTrips} />
    </div>
  );
};

const DocumentsPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <FileText className="h-5 w-5" />
            <span>Документы</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-gray-500">
            Управление документами будет доступно в следующих версиях.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const StatisticsPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <BarChart3 className="h-5 w-5" />
            <span>Статистика</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-gray-500">
            Аналитика и отчеты будут доступны в следующих версиях.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-gray-500">
            Настройки приложения будут доступны в следующих версиях.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [currentView, setCurrentView] = useState('dashboard');

  const handleMenuSelect = (view: string) => {
    setCurrentView(view);
    onNavigate(view);
  };

  const handleNavigateToTrips = () => {
    setCurrentView('trips');
    onNavigate('trips');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'trips':
        return <TripList />;
      case 'contractors':
        return <ContractorList />;
      case 'drivers':
        return <DriverList />;
      case 'vehicles':
        return <VehicleList />;
      case 'routes':
        return <RouteList />;
      case 'cargo-types':
        return <CargoTypeList />;
      case 'documents':
        return <DocumentsPage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardHome onNavigateToTrips={handleNavigateToTrips} />;
    }
  };

  return (
    <MobileLayout>
      {renderCurrentView()}
    </MobileLayout>
  );
};

export default Dashboard;
