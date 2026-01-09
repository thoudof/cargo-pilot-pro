
import React from 'react';
import { ContractorList } from '@/components/Contractors/ContractorList';
import { PageHeader } from '@/components/Layout/PageHeader';

export const ContractorsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Контрагенты" 
        description="Управление клиентами и партнёрами"
      />
      <ContractorList />
    </div>
  );
};
