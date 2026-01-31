import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, GripVertical, Truck, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trip, TripStatus } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TripForm } from './TripForm';

interface TripsCalendarProps {
  onTripClick?: (trip: Trip) => void;
}

export const TripsCalendar: React.FC<TripsCalendarProps> = ({
  onTripClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedTrip, setDraggedTrip] = useState<Trip | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => supabaseService.getTrips(),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ru });
  const calendarEnd = endOfWeek(monthEnd, { locale: ru });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tripsByDate = useMemo(() => {
    const map = new Map<string, Trip[]>();
    trips.forEach(trip => {
      const dateKey = format(trip.departureDate, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(trip);
    });
    return map;
  }, [trips]);

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PLANNED:
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case TripStatus.IN_PROGRESS:
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case TripStatus.COMPLETED:
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case TripStatus.CANCELLED:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  const handleDragStart = (e: React.DragEvent, trip: Trip) => {
    setDraggedTrip(trip);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', trip.id);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedTrip) return;

    // Don't update if same date
    if (isSameDay(draggedTrip.departureDate, targetDate)) {
      setDraggedTrip(null);
      return;
    }

    try {
      // Calculate the time difference to maintain the same time of day
      const originalDate = new Date(draggedTrip.departureDate);
      const newDate = new Date(targetDate);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());

      const { error } = await supabase
        .from('trips')
        .update({ departure_date: newDate.toISOString() })
        .eq('id', draggedTrip.id);

      if (error) throw error;

      toast.success(`Рейс перенесён на ${format(newDate, 'd MMMM', { locale: ru })}`);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    } catch (error) {
      console.error('Failed to update trip date:', error);
      toast.error('Не удалось перенести рейс');
    }

    setDraggedTrip(null);
  };

  const handleDayDoubleClick = (date: Date) => {
    setEditingTrip(undefined);
    setShowCreateDialog(true);
  };

  const handleTripClick = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    if (onTripClick) {
      onTripClick(trip);
    } else {
      setEditingTrip(trip);
      setShowCreateDialog(true);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingTrip(undefined);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Календарь рейсов
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date())}
            >
              Сегодня
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "text-center text-sm font-medium py-2",
                  i >= 5 ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTrips = tripsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isDragOver = dragOverDate && isSameDay(day, dragOverDate);

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[100px] p-1 border rounded-lg transition-colors",
                    !isCurrentMonth && "opacity-40",
                    isToday && "border-primary",
                    isDragOver && "bg-primary/10 border-primary border-2",
                    "hover:bg-muted/50 cursor-pointer"
                  )}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                  onDoubleClick={() => handleDayDoubleClick(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTrips.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {dayTrips.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 max-h-[80px] overflow-y-auto">
                    {dayTrips.slice(0, 3).map((trip) => (
                      <div
                        key={trip.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, trip)}
                        onClick={(e) => handleTripClick(e, trip)}
                        className={cn(
                          "flex items-center gap-1 p-1 rounded text-xs cursor-grab active:cursor-grabbing border",
                          getStatusColor(trip.status)
                        )}
                      >
                        <GripVertical className="h-3 w-3 flex-shrink-0 opacity-50" />
                        <Truck className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate flex-1">
                          {trip.pointA.split(',')[0]} → {trip.pointB.split(',')[0]}
                        </span>
                      </div>
                    ))}
                    {dayTrips.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayTrips.length - 3} ещё
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
            <span className="text-sm text-muted-foreground">Статусы:</span>
            {[
              { status: TripStatus.PLANNED, label: 'Запланирован' },
              { status: TripStatus.IN_PROGRESS, label: 'В пути' },
              { status: TripStatus.COMPLETED, label: 'Завершён' },
              { status: TripStatus.CANCELLED, label: 'Отменён' },
            ].map(({ status, label }) => (
              <div key={status} className="flex items-center gap-1">
                <div className={cn("w-3 h-3 rounded", getStatusColor(status))} />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Trip Dialog */}
      <TripForm
        trip={editingTrip}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};