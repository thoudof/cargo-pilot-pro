
import React from 'react';
import { TripsReportTable } from '@/components/Reports/TripsReportTable';

export const ReportsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Отчеты по рейсам</h1>
        <p className="text-muted-foreground">Детальная статистика и анализ рейсов</p>
      </div>
      <TripsReportTable />
    </div>
  );
};
