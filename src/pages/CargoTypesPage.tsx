
import React from 'react';
import { CargoTypeList } from '@/components/CargoTypes/CargoTypeList';

export const CargoTypesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <CargoTypeList />
    </div>
  );
};
