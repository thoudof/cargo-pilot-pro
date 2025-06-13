
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Plus } from 'lucide-react';

interface TripListEmptyStateProps {
  searchTerm: string;
  statusFilter: string;
  onAddTrip: () => void;
}

export const TripListEmptyState: React.FC<TripListEmptyStateProps> = ({
  searchTerm,
  statusFilter,
  onAddTrip
}) => {
  const hasFilters = searchTerm || statusFilter !== 'all';

  return (
    <Card className="text-center py-12">
      <CardContent>
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Нет рейсов</h3>
        <p className="text-muted-foreground mb-4">
          {hasFilters 
            ? 'Не найдено рейсов по заданным критериям' 
            : 'Добавьте первый рейс для начала работы'
          }
        </p>
        {!hasFilters && (
          <Button onClick={onAddTrip}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить рейс
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
