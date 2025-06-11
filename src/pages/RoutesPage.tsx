
import React from 'react';
import { RouteList } from '@/components/Routes/RouteList';
import { MobileLayout } from '@/components/Layout/MobileLayout';

export const RoutesPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Маршруты</h1>
          <p className="text-gray-600">Управление маршрутами перевозок</p>
        </div>
        <RouteList />
      </div>
    </MobileLayout>
  );
};
