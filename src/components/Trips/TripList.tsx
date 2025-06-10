
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Calendar, Clock, User } from 'lucide-react';
import { Trip, TripStatus, Contractor } from '@/types';
import { db } from '@/services/database';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripListProps {
  onAddTrip: () => void;
  onEditTrip: (trip: Trip) => void;
}

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

export const TripList: React.FC<TripListProps> = ({
  onAddTrip,
  onEditTrip
}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tripsData, contractorsData] = await Promise.all([
        db.getTrips(),
        db.getContractors()
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
    const matchesSearch = 
      trip.pointA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pointB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContractorName(trip.contractorId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск рейсов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-12"
            />
          </div>
          <Button onClick={onAddTrip} className="h-12 px-6">
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-12">
            <SelectValue placeholder="Статус рейса" />
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
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет рейсов</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Не найдено рейсов по заданным критериям' 
                : 'Добавьте первый рейс для начала работы'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={onAddTrip}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить рейс
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader 
                className="pb-3"
                onClick={() => onEditTrip(trip)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{trip.pointA} → {trip.pointB}</CardTitle>
                      <div className={`w-3 h-3 rounded-full ${statusColors[trip.status]}`}></div>
                      <Badge variant="outline">{statusLabels[trip.status]}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(trip.departureDate), 'dd MMMM yyyy, HH:mm', { locale: ru })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{getContractorName(trip.contractorId)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
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
                  <p className="font-medium text-sm">Груз</p>
                  <p className="text-sm text-muted-foreground">{trip.cargo.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.cargo.weight} кг, {trip.cargo.volume} м³
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
