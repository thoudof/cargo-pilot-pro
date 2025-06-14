
import React from 'react';
import { ContractorList } from '@/components/Contractors/ContractorList';

export const ContractorsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Подрядчики</h1>
        <p className="text-muted-foreground">Управление подрядчиками</p>
      </div>
      <ContractorList />
    </div>
  );
};
