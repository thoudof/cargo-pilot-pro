
import React from 'react';
import { DriverList } from '@/components/Drivers/DriverList';
import { MobileLayout } from '@/components/Layout/MobileLayout';

export const DriversPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Водители</h1>
          <p className="text-gray-600">Управление водителями</p>
        </div>
        <DriverList />
      </div>
    </MobileLayout>
  );
};
