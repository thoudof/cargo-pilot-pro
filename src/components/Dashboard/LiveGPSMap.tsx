import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Truck, RefreshCw, Users, Navigation, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const createTruckIcon = (isActive: boolean) => L.divIcon({
  className: 'custom-truck-marker',
  html: `
    <div class="relative">
      <div class="w-8 h-8 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'} flex items-center justify-center shadow-lg border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
      ${isActive ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>' : ''}
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface DriverLocation {
  id: string;
  tripId: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recordedAt: string;
  tripRoute: string;
  tripStatus: string;
}

interface MapBoundsUpdaterProps {
  locations: DriverLocation[];
}

const MapBoundsUpdater: React.FC<MapBoundsUpdaterProps> = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
};

interface LiveGPSMapProps {
  className?: string;
}

export const LiveGPSMap: React.FC<LiveGPSMapProps> = ({ className }) => {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading, refetch } = useQuery({
    queryKey: ['live-driver-locations'],
    queryFn: async () => {
      // Get latest location for each active trip
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          id,
          point_a,
          point_b,
          status,
          driver_id,
          drivers(name)
        `)
        .eq('status', 'in_progress');

      if (tripsError) throw tripsError;
      if (!trips || trips.length === 0) return [];

      const driverLocations: DriverLocation[] = [];

      for (const trip of trips) {
        const { data: locations, error: locError } = await supabase
          .from('trip_locations')
          .select('*')
          .eq('trip_id', trip.id)
          .order('recorded_at', { ascending: false })
          .limit(1);

        if (locError) {
          console.error('Error fetching location:', locError);
          continue;
        }

        if (locations && locations.length > 0) {
          const loc = locations[0];
          driverLocations.push({
            id: loc.id,
            tripId: trip.id,
            driverId: trip.driver_id || '',
            driverName: (trip.drivers as any)?.name || 'Неизвестный водитель',
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            speed: loc.speed ? Number(loc.speed) : null,
            heading: loc.heading ? Number(loc.heading) : null,
            recordedAt: loc.recorded_at,
            tripRoute: `${trip.point_a?.split(',')[0]} → ${trip.point_b?.split(',')[0]}`,
            tripStatus: trip.status,
          });
        }
      }

      return driverLocations;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Realtime subscription for new locations
  useEffect(() => {
    const channel = supabase
      .channel('live-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_locations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['live-driver-locations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const defaultCenter: [number, number] = [55.7558, 37.6173]; // Moscow

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS-трекинг водителей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          GPS-трекинг водителей
          {locations.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {locations.length} активных
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Обновить
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="h-[400px] rounded-lg overflow-hidden border">
              {locations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center bg-muted">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Нет активных рейсов с GPS-данными
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Когда водители начнут рейсы, их местоположение появится здесь
                  </p>
                </div>
              ) : (
                <MapContainer
                  center={defaultCenter}
                  zoom={6}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapBoundsUpdater locations={locations} />

                  {locations.map((location) => (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude]}
                      icon={createTruckIcon(true)}
                      eventHandlers={{
                        click: () => setSelectedDriver(location.driverId),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {location.driverName}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {location.tripRoute}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {location.speed !== null && (
                              <span className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {Math.round(location.speed)} км/ч
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(location.recordedAt), { 
                                addSuffix: true, 
                                locale: ru 
                              })}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Driver list */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg">
              <div className="p-3 border-b">
                <h4 className="font-medium text-sm">Водители в пути</h4>
              </div>
              <ScrollArea className="h-[352px]">
                {locations.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Нет активных водителей
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className={cn(
                          "p-2 rounded-lg border cursor-pointer transition-colors",
                          selectedDriver === location.driverId 
                            ? "border-primary bg-primary/5" 
                            : "hover:bg-muted"
                        )}
                        onClick={() => setSelectedDriver(location.driverId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="font-medium text-sm truncate">
                            {location.driverName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {location.tripRoute}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          {location.speed !== null && (
                            <span>{Math.round(location.speed)} км/ч</span>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(location.recordedAt), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};