
import React from 'react';
import { TripList } from '@/components/Trips/TripList';

export const TripsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <TripList />
    </div>
  );
};
