
import React from 'react';
import { TripList } from '@/components/Trips/TripList';
import { PageHeader } from '@/components/Layout/PageHeader';

export const TripsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Рейсы" 
        description="Управление рейсами и логистикой"
      />
      <TripList />
    </div>
  );
};
