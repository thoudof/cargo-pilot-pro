
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Calendar as CalendarIcon, Filter, Truck, MapPin } from 'lucide-react';
import { Trip, TripStatus, Contractor } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface TripsOverviewProps {
  onNavigateToTrips: () => void;
}

export const TripsOverview: React.FC<TripsOverviewProps> = ({ onNavigateToTrips }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departureFromDate, setDepartureFromDate] = useState<Date>();
  const [departureToDate, setDepartureToDate] = useState<Date>();
  const [arrivalFromDate, setArrivalFromDate] = useState<Date>();
  const [arrivalToDate, setArrivalToDate] = useState<Date>();
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tripsData, contractorsData] = await Promise.all([
        supabaseService.getTrips(),
        supabaseService.getContractors()
      ]);
      setTrips(tripsData);
      setContractors(contractorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContractorName = (contractorId: string) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.companyName || 'Неизвестный контрагент';
  };

  const filteredTrips = trips.filter(trip => {
    // Поиск по тексту
    const matchesSearch = 
      trip.pointA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pointB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContractorName(trip.contractorId).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Фильтр по статусу
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    
    // Фильтр по дате отправления
    const departureDate = new Date(trip.departureDate);
    const matchesDepartureFrom = !departureFromDate || departureDate >= departureFromDate;
    const matchesDepartureTo = !departureToDate || departureDate <= departureToDate;
    
    // Фильтр по дате прибытия
    const arrivalDate = trip.arrivalDate ? new Date(trip.arrivalDate) : null;
    const matchesArrivalFrom = !arrivalFromDate || (arrivalDate && arrivalDate >= arrivalFromDate);
    const matchesArrivalTo = !arrivalToDate || (arrivalDate && arrivalDate <= arrivalToDate);
    
    // Фильтр по городам
    const matchesCity = !cityFilter || 
      trip.pointA.toLowerCase().includes(cityFilter.toLowerCase()) ||
      trip.pointB.toLowerCase().includes(cityFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesDepartureFrom && 
           matchesDepartureTo && matchesArrivalFrom && matchesArrivalTo && matchesCity;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartureFromDate(undefined);
    setDepartureToDate(undefined);
    setArrivalFromDate(undefined);
    setArrivalToDate(undefined);
    setCityFilter('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Рейсы
            </span>
            <Button onClick={onNavigateToTrips} variant="outline" size="sm">
              Показать все
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Основные фильтры */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск рейсов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value={TripStatus.PLANNED}>Планируется</SelectItem>
                  <SelectItem value={TripStatus.IN_PROGRESS}>В пути</SelectItem>
                  <SelectItem value={TripStatus.COMPLETED}>Завершён</SelectItem>
                  <SelectItem value={TripStatus.CANCELLED}>Отменён</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Фильтр по городам..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Фильтры по датам */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата отправления</label>
                <div className="flex gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !departureFromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {departureFromDate ? format(departureFromDate, "dd.MM.yy") : "От"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={departureFromDate}
                        onSelect={setDepartureFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !departureToDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {departureToDate ? format(departureToDate, "dd.MM.yy") : "До"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={departureToDate}
                        onSelect={setDepartureToDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Дата прибытия</label>
                <div className="flex gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !arrivalFromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {arrivalFromDate ? format(arrivalFromDate, "dd.MM.yy") : "От"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={arrivalFromDate}
                        onSelect={setArrivalFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !arrivalToDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {arrivalToDate ? format(arrivalToDate, "dd.MM.yy") : "До"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={arrivalToDate}
                        onSelect={setArrivalToDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Button onClick={clearFilters} variant="ghost" size="sm" className="self-start">
              <Filter className="mr-2 h-4 w-4" />
              Очистить фильтры
            </Button>
          </div>

          {/* Список рейсов */}
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {trips.length === 0 ? 'Нет рейсов' : 'Не найдено рейсов по заданным критериям'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTrips.slice(0, 10).map((trip) => (
                <Card key={trip.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{trip.pointA} → {trip.pointB}</span>
                        <div className={`w-2 h-2 rounded-full ${statusColors[trip.status]}`}></div>
                        <Badge variant="outline" className="text-xs">{statusLabels[trip.status]}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          Отправление: {format(new Date(trip.departureDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </div>
                        <div>Водитель: {trip.driver.name}</div>
                        <div>Транспорт: {trip.vehicle.licensePlate}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredTrips.length > 10 && (
                <div className="text-center">
                  <Button onClick={onNavigateToTrips} variant="link" size="sm">
                    Показать еще {filteredTrips.length - 10} рейсов
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
