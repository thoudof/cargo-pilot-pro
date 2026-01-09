
import React from 'react';
import { CargoTypeList } from '@/components/CargoTypes/CargoTypeList';
import { PageHeader } from '@/components/Layout/PageHeader';

export const CargoTypesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Типы грузов" 
        description="Классификация грузов для рейсов"
      />
      <CargoTypeList />
    </div>
  );
};
