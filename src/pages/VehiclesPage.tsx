
import React from 'react';
import { VehicleList } from '@/components/Vehicles/VehicleList';
import { MobileLayout } from '@/components/Layout/MobileLayout';

export const VehiclesPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Транспорт</h1>
          <p className="text-gray-600">Управление автопарком</p>
        </div>
        <VehicleList />
      </div>
    </MobileLayout>
  );
};
