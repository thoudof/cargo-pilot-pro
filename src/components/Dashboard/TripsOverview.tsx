
import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Truck } from 'lucide-react';
import { Trip, TripStatus } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useDataCache } from '@/hooks/useDataCache';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';

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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const { data: trips = [], loading } = useDataCache<Trip[]>(
    'trips-overview',
    () => optimizedSupabaseService.getTripsOptimized(20),
    { ttl: 2 * 60 * 1000 }
  );

  const { data: contractors = {} } = useDataCache<Record<string, string>>(
    'contractors-overview',
    async () => {
      const { data, error } = await optimizedSupabaseService.supabase
        .from('contractors')
        .select('id, company_name');
      if (error) throw error;
      return data.reduce((acc, c) => {
        acc[c.id] = c.company_name;
        return acc;
      }, {} as Record<string, string>);
    },
    { ttl: 5 * 60 * 1000 }
  );

  const getContractorName = useCallback((contractorId: string) => {
    return contractors[contractorId] || 'Неизвестный контрагент';
  }, [contractors]);

  const filteredTrips = useMemo(() => {
    if (!Array.isArray(trips) || trips.length === 0) return [];
    
    let result = trips;
    
    if (statusFilter !== 'all') {
      result = result.filter(trip => trip.status === statusFilter);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(trip => 
        trip.pointA.toLowerCase().includes(searchLower) ||
        trip.pointB.toLowerCase().includes(searchLower) ||
        trip.driver.name.toLowerCase().includes(searchLower)
      );
    }
    
    return result.slice(0, 10);
  }, [trips, searchTerm, statusFilter]);

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

          {filteredTrips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {Array.isArray(trips) && trips.length === 0 ? 'Нет рейсов' : 'Не найдено рейсов по заданным критериям'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTrips.map((trip) => (
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
              {Array.isArray(trips) && trips.length > 10 && (
                <div className="text-center">
                  <Button onClick={onNavigateToTrips} variant="link" size="sm">
                    Показать еще {trips.length - 10} рейсов
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
