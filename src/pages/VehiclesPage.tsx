
import React from 'react';
import { VehicleList } from '@/components/Vehicles/VehicleList';

export const VehiclesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Транспорт</h1>
        <p className="text-muted-foreground">Управление транспортными средствами</p>
      </div>
      <VehicleList />
    </div>
  );
};
