
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Edit2, Trash2, Receipt, DollarSign, MapPin, Truck, Package, ArrowRight, Phone } from 'lucide-react';
import { Trip, TripStatus } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const statusConfig = {
  [TripStatus.PLANNED]: { 
    color: 'bg-info/10 text-info border-info/20', 
    label: 'Планируется',
    dot: 'bg-info'
  },
  [TripStatus.IN_PROGRESS]: { 
    color: 'bg-warning/10 text-warning border-warning/20', 
    label: 'В пути',
    dot: 'bg-warning animate-pulse'
  },
  [TripStatus.COMPLETED]: { 
    color: 'bg-success/10 text-success border-success/20', 
    label: 'Завершён',
    dot: 'bg-success'
  },
  [TripStatus.CANCELLED]: { 
    color: 'bg-destructive/10 text-destructive border-destructive/20', 
    label: 'Отменён',
    dot: 'bg-destructive'
  }
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
    format(new Date(trip.departureDate), 'dd MMM yyyy, HH:mm', { locale: ru }),
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

  const profit = useMemo(() => {
    const value = trip.cargo.value || 0;
    const expenses = tripExpenses[trip.id] || 0;
    return value - expenses;
  }, [trip.cargo.value, tripExpenses, trip.id]);

  const status = statusConfig[trip.status];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 bg-card overflow-hidden">
      {/* Status indicator bar */}
      <div className={`h-1 w-full ${status.dot.replace('animate-pulse', '')}`} />
      
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 cursor-pointer" onClick={() => onViewDetails(trip)}>
            {/* Route */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{trip.pointA}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>{trip.pointB}</span>
              </div>
            </div>
            
            {/* Status & Date */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className={`${status.color} border`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${status.dot}`} />
                {status.label}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formattedDepartureDate}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              onClick={() => onEditTrip(trip)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDeleteTrip(trip)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 cursor-pointer" onClick={() => onViewDetails(trip)}>
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Driver */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Водитель</p>
              <p className="font-medium text-sm truncate">{trip.driver.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {trip.driver.phone}
              </p>
            </div>
          </div>
          
          {/* Vehicle */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-info/10">
              <Truck className="h-4 w-4 text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Транспорт</p>
              <p className="font-medium text-sm truncate">{trip.vehicle.brand} {trip.vehicle.model}</p>
              <p className="text-xs text-muted-foreground">{trip.vehicle.licensePlate}</p>
            </div>
          </div>
        </div>
        
        {/* Cargo & Contractor */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-warning/10">
              <Package className="h-4 w-4 text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Груз</p>
              <p className="font-medium text-sm truncate">{trip.cargo.description}</p>
              <p className="text-xs text-muted-foreground">
                {trip.cargo.weight} кг • {trip.cargo.volume} м³
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-success/10">
              <User className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Контрагент</p>
              <p className="font-medium text-sm truncate">{contractorName}</p>
            </div>
          </div>
        </div>
        
        {/* Financial Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Стоимость</p>
                <p className="font-semibold text-success">{cargoValue} ₽</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Расходы</p>
                <p className="font-semibold text-destructive">{expenseAmount} ₽</p>
              </div>
            </div>
          </div>
          <div className={`text-right ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
            <p className="text-xs text-muted-foreground">Прибыль</p>
            <p className="font-bold text-lg">{profit.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
