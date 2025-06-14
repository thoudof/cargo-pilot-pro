
import React from 'react';
import { CargoTypeList } from '@/components/CargoTypes/CargoTypeList';

export const CargoTypesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Типы грузов</h1>
        <p className="text-muted-foreground">Управление типами грузов</p>
      </div>
      <CargoTypeList />
    </div>
  );
};
