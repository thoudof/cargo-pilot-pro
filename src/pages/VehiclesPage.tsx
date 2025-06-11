
import React from 'react';
import { VehicleList } from '@/components/Vehicles/VehicleList';

export const VehiclesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <VehicleList />
    </div>
  );
};
