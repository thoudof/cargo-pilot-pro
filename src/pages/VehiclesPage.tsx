
import React from 'react';
import { VehicleList } from '@/components/Vehicles/VehicleList';
import { PageHeader } from '@/components/Layout/PageHeader';

export const VehiclesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Транспорт" 
        description="Управление транспортными средствами"
      />
      <VehicleList />
    </div>
  );
};
