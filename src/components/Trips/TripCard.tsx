
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  showCheckbox?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  contractors,
  tripExpenses,
  onViewDetails,
  onEditTrip,
  onDeleteTrip,
  isSelected = false,
  onSelectChange,
  showCheckbox = false
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

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    if (onSelectChange && typeof checked === 'boolean') {
      onSelectChange(checked);
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 bg-card overflow-hidden ${isSelected ? 'ring-2 ring-primary border-primary/50' : ''}`}>
      {/* Status indicator bar */}
      <div className={`h-1 w-full ${status.dot.replace('animate-pulse', '')}`} />
      
      <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          {showCheckbox && (
            <div className="flex items-center pt-1" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                className="h-4 w-4 sm:h-5 sm:w-5"
              />
            </div>
          )}
          <div className="flex-1 cursor-pointer min-w-0" onClick={() => onViewDetails(trip)}>
            {/* Route */}
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg font-semibold text-foreground">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-none">{trip.pointA}</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-none">{trip.pointB}</span>
              </div>
            </div>
            
            {/* Status & Date */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Badge variant="outline" className={`${status.color} border text-xs`}>
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${status.dot}`} />
                {status.label}
              </Badge>
              <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{formattedDepartureDate}</span>
              </div>
            </div>
          </div>
          
          {/* Actions - always visible on mobile */}
          <div className="flex items-center gap-0.5 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 hover:text-primary"
              onClick={() => onEditTrip(trip)}
            >
              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDeleteTrip(trip)}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 cursor-pointer px-3 sm:px-6 pb-3 sm:pb-6" onClick={() => onViewDetails(trip)}>
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          {/* Driver */}
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Водитель</p>
              <p className="font-medium text-xs sm:text-sm truncate">{trip.driver.name}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {trip.driver.phone}
              </p>
            </div>
          </div>
          
          {/* Vehicle */}
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="p-1.5 sm:p-2 rounded-lg bg-info/10">
              <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Транспорт</p>
              <p className="font-medium text-xs sm:text-sm truncate">{trip.vehicle.brand} {trip.vehicle.model}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{trip.vehicle.licensePlate}</p>
            </div>
          </div>
        </div>
        
        {/* Cargo & Contractor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="p-1.5 sm:p-2 rounded-lg bg-warning/10">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Груз</p>
              <p className="font-medium text-xs sm:text-sm truncate">{trip.cargo.description}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {trip.cargo.weight} кг • {trip.cargo.volume} м³
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Контрагент</p>
              <p className="font-medium text-xs sm:text-sm truncate">{contractorName}</p>
            </div>
          </div>
        </div>
        
        {/* Financial Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 gap-2 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Стоимость</p>
                <p className="font-semibold text-xs sm:text-base text-success">{cargoValue} ₽</p>
              </div>
            </div>
            <div className="w-px h-6 sm:h-8 bg-border" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Расходы</p>
                <p className="font-semibold text-xs sm:text-base text-destructive">{expenseAmount} ₽</p>
              </div>
            </div>
          </div>
          <div className={`text-left sm:text-right ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Прибыль</p>
            <p className="font-bold text-sm sm:text-lg">{profit.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
