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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные рейсы</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrips}</div>
            <p className="text-xs text-muted-foreground">из {stats.totalTrips} всего</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Контрагенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contractors}</div>
            <p className="text-xs text-muted-foreground">всего</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Водители</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.drivers}</div>
            <p className="text-xs text-muted-foreground">в базе</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Транспорт</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehicles}</div>
            <p className="text-xs text-muted-foreground">в парке</p>
          </CardContent>
        </Card>
      </div>
      
      <TripsOverview onNavigateToTrips={onNavigateToTrips} />
    </div>
  );
};

const DocumentsPage = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Документы</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Управление документами будет доступно в следующих версиях.</p>
        </CardContent>
      </Card>
    </div>
  );
};

const StatisticsPage = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Статистика</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Аналитика и отчеты будут доступны в следующих версиях.</p>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Настройки приложения будут доступны в следующих версиях.</p>
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

  const getPageTitle = () => {
    switch (currentView) {
      case 'trips':
        return 'Рейсы';
      case 'contractors':
        return 'Контрагенты';
      case 'drivers':
        return 'Водители';
      case 'vehicles':
        return 'Транспорт';
      case 'routes':
        return 'Маршруты';
      case 'cargo-types':
        return 'Типы грузов';
      case 'documents':
        return 'Документы';
      case 'statistics':
        return 'Статистика';
      case 'settings':
        return 'Настройки';
      default:
        return 'Главная';
    }
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
    <MobileLayout
      title={getPageTitle()}
      onMenuSelect={handleMenuSelect}
      currentView={currentView}
    >
      {renderCurrentView()}
    </MobileLayout>
  );
};

export default Dashboard;
