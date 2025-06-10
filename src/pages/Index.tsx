import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/Layout/MobileLayout';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { TripList } from '@/components/Trips/TripList';
import { ContractorList } from '@/components/Contractors/ContractorList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, User, BarChart3, File } from 'lucide-react';
import { db } from '@/services/database';
import { nextCloudService } from '@/services/nextcloud';
import { Trip, Contractor } from '@/types';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize NextCloud structure
      const config = {
        serverUrl: 'https://your-nextcloud.com',
        username: 'transport',
        password: 'password',
        basePath: 'transport'
      };
      
      await nextCloudService.configure(config);
      await nextCloudService.initializeStructure();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true); // Continue anyway
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Главная';
      case 'trips': return 'Рейсы';
      case 'contractors': return 'Контрагенты';
      case 'documents': return 'Документы';
      case 'statistics': return 'Статистика';
      case 'settings': return 'Настройки';
      default: return 'Грузоперевозки';
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      
      case 'trips':
        return <TripList />;
      
      case 'contractors':
        return <ContractorList />;
      
      case 'documents':
        return (
          <Card className="text-center py-12">
            <CardContent>
              <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Документы</h3>
              <p className="text-muted-foreground">
                Интеграция с NextCloud для управления документами
              </p>
            </CardContent>
          </Card>
        );
      
      case 'statistics':
        return (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Статистика</h3>
              <p className="text-muted-foreground">
                Аналитика и отчеты по рейсам
              </p>
            </CardContent>
          </Card>
        );
      
      case 'settings':
        return (
          <Card className="text-center py-12">
            <CardContent>
              <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Настройки</h3>
              <p className="text-muted-foreground">
                Конфигурация приложения и NextCloud
              </p>
            </CardContent>
          </Card>
        );
      
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-medium">Инициализация приложения...</h2>
          <p className="text-muted-foreground">Настройка синхронизации с облаком</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout
      title={getPageTitle()}
      onMenuSelect={setCurrentView}
      currentView={currentView}
    >
      {renderCurrentView()}
    </MobileLayout>
  );
};

export default Index;
