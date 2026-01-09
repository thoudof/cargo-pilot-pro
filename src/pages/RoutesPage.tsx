
import React from 'react';
import { RouteList } from '@/components/Routes/RouteList';
import { PageHeader } from '@/components/Layout/PageHeader';

export const RoutesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Маршруты" 
        description="Управление маршрутами доставки"
      />
      <RouteList />
    </div>
  );
};
