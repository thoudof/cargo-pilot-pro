
import React from 'react';
import { RouteList } from '@/components/Routes/RouteList';

export const RoutesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Маршруты</h1>
        <p className="text-muted-foreground">Управление маршрутами</p>
      </div>
      <RouteList />
    </div>
  );
};
