
import React from 'react';
import { TripList } from '@/components/Trips/TripList';

export const TripsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Рейсы</h1>
        <p className="text-muted-foreground">Управление рейсами и логистикой</p>
      </div>
      <TripList />
    </div>
  );
};
