
import React, { useState } from 'react';
import { MobileLayout } from '@/components/Layout/MobileLayout';
import { ContractorList } from '@/components/Contractors/ContractorList';
import { TripList } from '@/components/Trips/TripList';
import { DriverList } from '@/components/Drivers/DriverList';
import { VehicleList } from '@/components/Vehicles/VehicleList';
import { RouteList } from '@/components/Routes/RouteList';
import { CargoTypeList } from '@/components/CargoTypes/CargoTypeList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, FileText, BarChart3, Calendar, Route, Package } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные рейсы</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 за сегодня</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Контрагенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">активных</p>
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
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">доступно</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Транспорт</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">в парке</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Последние рейсы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Москва → СПб</span>
              <span className="text-xs text-gray-500">В пути</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Казань → Екатеринбург</span>
              <span className="text-xs text-gray-500">Планируется</span>
            </div>
          </div>
        </CardContent>
      </Card>
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
        return <DashboardHome />;
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
