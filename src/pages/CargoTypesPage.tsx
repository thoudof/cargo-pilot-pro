
import React from 'react';
import { CargoTypeList } from '@/components/CargoTypes/CargoTypeList';
import { MobileLayout } from '@/components/Layout/MobileLayout';

export const CargoTypesPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Типы грузов</h1>
          <p className="text-gray-600">Управление типами перевозимых грузов</p>
        </div>
        <CargoTypeList />
      </div>
    </MobileLayout>
  );
};
