
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Edit2, Trash2, Receipt, DollarSign } from 'lucide-react';
import { Trip, TripStatus } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const statusColors = {
  [TripStatus.PLANNED]: 'bg-blue-500',
  [TripStatus.IN_PROGRESS]: 'bg-yellow-500',
  [TripStatus.COMPLETED]: 'bg-green-500',
  [TripStatus.CANCELLED]: 'bg-red-500'
};

const statusLabels = {
  [TripStatus.PLANNED]: 'Планируется',
  [TripStatus.IN_PROGRESS]: 'В пути',
  [TripStatus.COMPLETED]: 'Завершён',
  [TripStatus.CANCELLED]: 'Отменён'
};

interface SimpleContractor {
  id: string;
  companyName: string;
}

interface TripCardProps {
  trip: Trip;
  contractors: SimpleContractor[];
  tripExpenses: Record<string, number>;
  onViewDetails: (trip: Trip) => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  contractors,
  tripExpenses,
  onViewDetails,
  onEditTrip,
  onDeleteTrip
}) => {
  const contractorName = useMemo(() => {
    const contractor = contractors.find(c => c.id === trip.contractorId);
    return contractor?.companyName || 'Неизвестный контрагент';
  }, [contractors, trip.contractorId]);

  const formattedDepartureDate = useMemo(() => 
    format(new Date(trip.departureDate), 'dd MMMM yyyy, HH:mm', { locale: ru }),
    [trip.departureDate]
  );

  const expenseAmount = useMemo(() => 
    (tripExpenses[trip.id] || 0).toLocaleString('ru-RU'),
    [tripExpenses, trip.id]
  );

  const cargoValue = useMemo(() => 
    (trip.cargo.value || 0).toLocaleString('ru-RU'),
    [trip.cargo.value]
  );

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onViewDetails(trip)}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{trip.pointA} → {trip.pointB}</h3>
              <div className={`w-3 h-3 rounded-full ${statusColors[trip.status]}`}></div>
              <Badge variant="outline">{statusLabels[trip.status]}</Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDepartureDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{contractorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Receipt className="h-4 w-4" />
                <span>Расходы: {expenseAmount} ₽</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditTrip(trip)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTrip(trip)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0" onClick={() => onViewDetails(trip)}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Водитель</p>
            <p className="text-muted-foreground">{trip.driver.name}</p>
            <p className="text-muted-foreground">{trip.driver.phone}</p>
          </div>
          <div>
            <p className="font-medium">Транспорт</p>
            <p className="text-muted-foreground">{trip.vehicle.brand} {trip.vehicle.model}</p>
            <p className="text-muted-foreground">{trip.vehicle.licensePlate}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-sm">Груз</p>
              <p className="text-sm text-muted-foreground">{trip.cargo.description}</p>
              <p className="text-sm text-muted-foreground">
                {trip.cargo.weight} кг, {trip.cargo.volume} м³
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">Финансы</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Стоимость: {cargoValue} ₽
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                Расходы: {expenseAmount} ₽
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
