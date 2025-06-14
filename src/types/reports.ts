
import { Trip, TripStatus } from '@/types';

export interface TripWithExpenses extends Trip {
  totalExpenses: number;
  actualProfit: number;
  potentialProfit: number;
  isProfitActual: boolean;
}

export const statusLabels: Record<TripStatus, string> = {
  [TripStatus.PLANNED]: 'Планируется',
  [TripStatus.IN_PROGRESS]: 'В пути',
  [TripStatus.COMPLETED]: 'Завершён',
  [TripStatus.CANCELLED]: 'Отменён'
};

export const statusColors: Record<TripStatus, string> = {
  [TripStatus.PLANNED]: 'bg-blue-500',
  [TripStatus.IN_PROGRESS]: 'bg-yellow-500',
  [TripStatus.COMPLETED]: 'bg-green-500',
  [TripStatus.CANCELLED]: 'bg-red-500'
};

