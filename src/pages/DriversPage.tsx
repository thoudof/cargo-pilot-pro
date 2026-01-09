
import React from 'react';
import { DriverList } from '@/components/Drivers/DriverList';
import { PageHeader } from '@/components/Layout/PageHeader';

export const DriversPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Водители" 
        description="Управление водителями компании"
      />
      <DriverList />
    </div>
  );
};
