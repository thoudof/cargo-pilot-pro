
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  File, 
  TrendingUp, 
  MapPin,
  Plus
} from 'lucide-react';
import { Trip, TripStatus, Contractor } from '@/types';
import { db } from '@/services/database';
import { nextCloudService } from '@/services/nextcloud';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const syncStatus = nextCloudService.getSyncStatus();

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
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayTrips = trips.filter(trip => 
    isToday(new Date(trip.departureDate)) && trip.status !== TripStatus.CANCELLED
  );

  const upcomingTrips = trips.filter(trip => {
    const tripDate = new Date(trip.departureDate);
    return (isTomorrow(tripDate) || (tripDate > addDays(new Date(), 1) && tripDate <= addDays(new Date(), 7))) 
           && trip.status === TripStatus.PLANNED;
  });

  const activeTrips = trips.filter(trip => trip.status === TripStatus.IN_PROGRESS);
  const pendingTrips = trips.filter(trip => trip.status === TripStatus.PLANNED);

  const getContractorName = (contractorId: string) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.companyName || 'Неизвестный';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Сегодня</p>
                <p className="text-2xl font-bold">{todayTrips.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">В пути</p>
                <p className="text-2xl font-bold">{activeTrips.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Планируется</p>
                <p className="text-2xl font-bold">{pendingTrips.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Контрагенты</p>
                <p className="text-2xl font-bold">{contractors.length}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {syncStatus.isOnline ? 'Онлайн' : 'Офлайн'}
              </span>
              {syncStatus.pendingUploads > 0 && (
                <Badge variant="outline">{syncStatus.pendingUploads} ожидает загрузки</Badge>
              )}
            </div>
            {syncStatus.lastSync && (
              <span className="text-sm text-muted-foreground">
                Синхронизация: {format(syncStatus.lastSync, 'dd.MM.yyyy HH:mm', { locale: ru })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Trips */}
      {todayTrips.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Рейсы на сегодня
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => onNavigate('trips')}>
                Все рейсы
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTrips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{trip.pointA} → {trip.pointB}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(trip.departureDate), 'HH:mm')} • {getContractorName(trip.contractorId)}
                  </p>
                </div>
                <Badge variant={trip.status === TripStatus.IN_PROGRESS ? 'default' : 'secondary'}>
                  {trip.status === TripStatus.IN_PROGRESS ? 'В пути' : 'Планируется'}
                </Badge>
              </div>
            ))}
            {todayTrips.length > 3 && (
              <p className="text-sm text-muted-foreground text-center">
                +{todayTrips.length - 3} рейс{todayTrips.length - 3 === 1 ? '' : todayTrips.length - 3 < 5 ? 'а' : 'ов'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Предстоящие рейсы
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => onNavigate('trips')}>
                Все рейсы
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTrips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{trip.pointA} → {trip.pointB}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(trip.departureDate), 'dd MMM, HH:mm', { locale: ru })} • {getContractorName(trip.contractorId)}
                  </p>
                </div>
                <Badge variant="outline">Планируется</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <Button 
              className="w-full h-20 flex-col gap-2" 
              variant="outline"
              onClick={() => onNavigate('trips')}
            >
              <Plus className="h-6 w-6" />
              <span>Новый рейс</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button 
              className="w-full h-20 flex-col gap-2" 
              variant="outline"
              onClick={() => onNavigate('contractors')}
            >
              <User className="h-6 w-6" />
              <span>Контрагенты</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
