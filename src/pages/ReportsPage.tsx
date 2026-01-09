
import React from 'react';
import { TripsReportTable } from '@/components/Reports/TripsReportTable';
import { PageHeader } from '@/components/Layout/PageHeader';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Отчёты" 
        description="Детальная статистика и анализ рейсов"
      />
      <TripsReportTable />
    </div>
  );
};
