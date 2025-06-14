
import React from 'react';
import { DriverList } from '@/components/Drivers/DriverList';

export const DriversPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Водители</h1>
        <p className="text-muted-foreground">Управление водителями</p>
      </div>
      <DriverList />
    </div>
  );
};
