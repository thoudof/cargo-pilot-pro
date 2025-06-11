
import React from 'react';
import { TripList } from '@/components/Trips/TripList';
import { MobileLayout } from '@/components/Layout/MobileLayout';

export const TripsPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Рейсы</h1>
          <p className="text-gray-600">Управление рейсами и перевозками</p>
        </div>
        <TripList />
      </div>
    </MobileLayout>
  );
};
