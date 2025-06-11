
import React from 'react';
import { ContractorList } from '@/components/Contractors/ContractorList';
import { MobileLayout } from '@/components/Layout/MobileLayout';

export const ContractorsPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Контрагенты</h1>
          <p className="text-gray-600">Управление клиентами и партнерами</p>
        </div>
        <ContractorList />
      </div>
    </MobileLayout>
  );
};
