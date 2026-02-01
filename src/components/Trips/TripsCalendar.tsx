import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, GripVertical, Truck, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const STATUS_CONFIG = {
  [TripStatus.PLANNED]: {
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    label: 'Запланирован',
    dotColor: 'bg-blue-500'
  },
  [TripStatus.IN_PROGRESS]: {
    color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
    label: 'В пути',
    dotColor: 'bg-amber-500'
  },
  [TripStatus.COMPLETED]: {
    color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    label: 'Завершён',
    dotColor: 'bg-green-500'
  },
  [TripStatus.CANCELLED]: {
    color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30',
    label: 'Отменён',
    dotColor: 'bg-gray-500'
  }
};

export const TripsCalendar: React.FC<TripsCalendarProps> = ({ onTripClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedTrip, setDraggedTrip] = useState<Trip | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  const getStatusConfig = useCallback((status: TripStatus) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG[TripStatus.PLANNED];
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, trip: Trip) => {
    setDraggedTrip(trip);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', trip.id);
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedTrip(null);
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedTrip) return;

    if (isSameDay(draggedTrip.departureDate, targetDate)) {
      setDraggedTrip(null);
      return;
    }

    try {
      const originalDate = new Date(draggedTrip.departureDate);
      const newDate = new Date(targetDate);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());

      const { error } = await supabase
        .from('trips')
        .update({ departure_date: newDate.toISOString() })
        .eq('id', draggedTrip.id);

      if (error) throw error;

      toast.success(
        `Рейс "${draggedTrip.pointA.split(',')[0]} → ${draggedTrip.pointB.split(',')[0]}" перенесён на ${format(newDate, 'd MMMM', { locale: ru })}`
      );
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    } catch (error) {
      console.error('Failed to update trip date:', error);
      toast.error('Не удалось перенести рейс');
    }

    setDraggedTrip(null);
  }, [draggedTrip, queryClient]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleDayDoubleClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setEditingTrip(undefined);
    setShowCreateDialog(true);
  }, []);

  const handleTripClick = useCallback((e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    if (onTripClick) {
      onTripClick(trip);
    } else {
      setEditingTrip(trip);
      setShowCreateDialog(true);
    }
  }, [onTripClick]);

  const handleFormSuccess = useCallback(() => {
    setShowCreateDialog(false);
    setEditingTrip(undefined);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
  }, [queryClient]);

  const handleAddTrip = useCallback(() => {
    setEditingTrip(undefined);
    setShowCreateDialog(true);
  }, []);

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Календарь рейсов
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium capitalize">
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
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Сегодня
            </Button>
            <Button size="sm" onClick={handleAddTrip}>
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Drag indicator */}
          {draggedTrip && (
            <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/30 text-sm flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-primary" />
              <span>Перетащите на нужную дату:</span>
              <Badge variant="secondary">
                {draggedTrip.pointA.split(',')[0]} → {draggedTrip.pointB.split(',')[0]}
              </Badge>
            </div>
          )}

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "text-center text-sm font-medium py-2",
                  i >= 5 ? "text-destructive" : "text-muted-foreground"
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
              const isTodayDate = isToday(day);
              const isDragOver = dragOverDate && isSameDay(day, dragOverDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[100px] p-1 border rounded-lg transition-all duration-200 cursor-pointer",
                    !isCurrentMonth && "opacity-40 bg-muted/30",
                    isTodayDate && "border-primary border-2",
                    isDragOver && "bg-primary/20 border-primary border-2 scale-[1.02] shadow-lg",
                    isSelected && !isDragOver && "bg-accent/50 border-accent",
                    !isDragOver && !isSelected && "hover:bg-muted/50 hover:border-muted-foreground/30"
                  )}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                  onClick={() => handleDayClick(day)}
                  onDoubleClick={() => handleDayDoubleClick(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                        isTodayDate && "bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTrips.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {dayTrips.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 max-h-[80px] overflow-y-auto">
                    {dayTrips.slice(0, 3).map((trip) => {
                      const config = getStatusConfig(trip.status);
                      return (
                        <Tooltip key={trip.id}>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, trip)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => handleTripClick(e, trip)}
                              className={cn(
                                "flex items-center gap-1 p-1 rounded text-xs cursor-grab active:cursor-grabbing border transition-all",
                                "hover:shadow-sm hover:scale-[1.02]",
                                config.color
                              )}
                            >
                              <GripVertical className="h-3 w-3 flex-shrink-0 opacity-50" />
                              <Truck className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate flex-1">
                                {trip.pointA.split(',')[0]} → {trip.pointB.split(',')[0]}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{trip.pointA} → {trip.pointB}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(trip.departureDate, 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </p>
                              <Badge className={config.color}>{config.label}</Badge>
                              {trip.driver?.name && (
                                <p className="text-xs">Водитель: {trip.driver.name}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {dayTrips.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-0.5">
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
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", config.dotColor)} />
                <span className="text-xs">{config.label}</span>
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-auto">
              💡 Двойной клик для создания • Перетаскивание для переноса
            </span>
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
    </TooltipProvider>
  );
};
