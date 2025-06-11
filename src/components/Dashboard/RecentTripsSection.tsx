
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecentTripsSectionProps {
  stats: {
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
    plannedTrips: number;
  };
}

export const RecentTripsSection: React.FC<RecentTripsSectionProps> = ({ stats }) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Последние рейсы</span>
        </CardTitle>
        <button className="text-xs sm:text-sm text-primary hover:underline">
          Показать все
        </button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        {stats.totalTrips === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">
            У вас пока нет рейсов
          </p>
        ) : (
          <div className="space-y-2">
            <div className="text-xs sm:text-sm">
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} p-2 border rounded`}>
                <span>Активных рейсов: <strong>{stats.activeTrips}</strong></span>
                <span>Завершенных: <strong>{stats.completedTrips}</strong></span>
                <span>Запланированных: <strong>{stats.plannedTrips}</strong></span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
