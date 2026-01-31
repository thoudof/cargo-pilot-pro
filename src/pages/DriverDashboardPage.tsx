import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  AlertCircle,
  Route,
  Package,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TripStatus } from '@/types';

interface DriverTrip {
  id: string;
  point_a: string;
  point_b: string;
  departure_date: string;
  arrival_date: string | null;
  status: string;
  cargo_description: string | null;
  cargo_weight: number | null;
  driver_name: string | null;
  vehicle_license_plate: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
}

interface LocationState {
  isTracking: boolean;
  lastUpdate: Date | null;
  error: string | null;
  watchId: number | null;
}

export const DriverDashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationState, setLocationState] = useState<LocationState>({
    isTracking: false,
    lastUpdate: null,
    error: null,
    watchId: null,
  });
  const [activeTrip, setActiveTrip] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch driver's trips
  const fetchTrips = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get driver link
      const { data: driverUser } = await supabase
        .from('driver_users')
        .select('driver_id')
        .eq('user_id', session.user.id)
        .single();

      if (!driverUser) {
        setTrips([]);
        setIsLoading(false);
        return;
      }

      // Fetch trips assigned to this driver
      const { data: tripsData, error } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driverUser.driver_id)
        .in('status', ['planned', 'in_progress'])
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setTrips(tripsData || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить рейсы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Send location to server
  const sendLocation = useCallback(async (position: GeolocationPosition, tripId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        'https://xibihgkkubkcjdibysni.supabase.co/functions/v1/driver-location',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tripId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            altitude: position.coords.altitude,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send location');
      }

      setLocationState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('Error sending location:', error);
      setLocationState(prev => ({
        ...prev,
        error: 'Не удалось отправить локацию',
      }));
    }
  }, []);

  // Start GPS tracking
  const startTracking = useCallback((tripId: string) => {
    if (!navigator.geolocation) {
      toast({
        title: 'Ошибка',
        description: 'Геолокация не поддерживается вашим браузером',
        variant: 'destructive',
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => sendLocation(position, tripId),
      (error) => {
        console.error('Geolocation error:', error);
        setLocationState(prev => ({
          ...prev,
          error: `Ошибка геолокации: ${error.message}`,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    setLocationState({
      isTracking: true,
      lastUpdate: null,
      error: null,
      watchId,
    });
    setActiveTrip(tripId);

    toast({
      title: 'GPS-трекинг включён',
      description: 'Ваше местоположение отслеживается',
    });
  }, [sendLocation, toast]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (locationState.watchId !== null) {
      navigator.geolocation.clearWatch(locationState.watchId);
    }
    
    setLocationState({
      isTracking: false,
      lastUpdate: null,
      error: null,
      watchId: null,
    });
    setActiveTrip(null);

    toast({
      title: 'GPS-трекинг выключен',
    });
  }, [locationState.watchId, toast]);

  // Update trip status
  const updateTripStatus = async (tripId: string, newStatus: string) => {
    setUpdatingStatus(tripId);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', tripId);

      if (error) throw error;

      // Refresh trips
      await fetchTrips();

      toast({
        title: 'Статус обновлён',
        description: newStatus === 'in_progress' ? 'Рейс начат' : 'Рейс завершён',
      });

      // Stop tracking if completed
      if (newStatus === 'completed' && activeTrip === tripId) {
        stopTracking();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (date: string) => format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: ru });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Запланирован</Badge>;
      case 'in_progress':
        return <Badge variant="default"><Truck className="w-3 h-3 mr-1" />В пути</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-primary/80"><CheckCircle className="w-3 h-3 mr-1" />Завершён</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Панель водителя" description="Загрузка..." />
        <div className="grid gap-4">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Панель водителя"
        description="Управление рейсами и GPS-трекинг"
      />

      {/* GPS Status Card */}
      <Card className={locationState.isTracking ? 'border-green-500' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className={`h-5 w-5 ${locationState.isTracking ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <CardTitle className="text-lg">GPS-трекинг</CardTitle>
            </div>
            {locationState.isTracking && (
              <Badge variant="default">Активен</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {locationState.isTracking ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Отслеживается рейс: {trips.find(t => t.id === activeTrip)?.point_a} → {trips.find(t => t.id === activeTrip)?.point_b}
              </p>
              {locationState.lastUpdate && (
                <p className="text-xs text-muted-foreground">
                  Последнее обновление: {locationState.lastUpdate.toLocaleTimeString('ru-RU')}
                </p>
              )}
              {locationState.error && (
                <p className="text-xs text-destructive">{locationState.error}</p>
              )}
              <Button variant="destructive" size="sm" onClick={stopTracking}>
                Остановить трекинг
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Начните рейс, чтобы активировать GPS-трекинг
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trips List */}
      {trips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              У вас нет назначенных рейсов
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Обратитесь к диспетчеру для назначения рейса
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <Card key={trip.id} className={activeTrip === trip.id ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Route className="h-5 w-5" />
                      {trip.point_a} → {trip.point_b}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Отправление: {formatDate(trip.departure_date)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(trip.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trip details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {trip.cargo_description && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{trip.cargo_description}</span>
                    </div>
                  )}
                  {trip.cargo_weight && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Вес:</span>
                      <span>{trip.cargo_weight} кг</span>
                    </div>
                  )}
                  {trip.vehicle_license_plate && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>{trip.vehicle_brand} {trip.vehicle_model} ({trip.vehicle_license_plate})</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {trip.status === 'planned' && (
                    <Button
                      onClick={() => {
                        updateTripStatus(trip.id, 'in_progress');
                        startTracking(trip.id);
                      }}
                      disabled={updatingStatus === trip.id || locationState.isTracking}
                      className="gap-2"
                    >
                      {updatingStatus === trip.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )}
                      Начать рейс
                    </Button>
                  )}
                  
                  {trip.status === 'in_progress' && (
                    <>
                      {!locationState.isTracking || activeTrip !== trip.id ? (
                        <Button
                          variant="outline"
                          onClick={() => startTracking(trip.id)}
                          className="gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          Включить GPS
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={stopTracking}
                          className="gap-2"
                        >
                          <Navigation className="h-4 w-4" />
                          GPS активен
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => updateTripStatus(trip.id, 'completed')}
                        disabled={updatingStatus === trip.id}
                        className="gap-2"
                        variant="default"
                      >
                        {updatingStatus === trip.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Завершить рейс
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverDashboardPage;
