import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, Clock, Gauge, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface TripLocation {
  id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recorded_at: string;
}

interface TripLocationMapProps {
  tripId: string;
  onClose?: () => void;
}

// Component to fit map bounds to the track
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
};

// Custom start marker icon
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom end marker icon
const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const TripLocationMap: React.FC<TripLocationMapProps> = ({ tripId, onClose }) => {
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('trip_locations')
        .select('id, latitude, longitude, speed, heading, accuracy, recorded_at')
        .eq('trip_id', tripId)
        .order('recorded_at', { ascending: true });

      if (fetchError) throw fetchError;
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Не удалось загрузить GPS-данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [tripId]);

  // Convert locations to positions array for polyline
  const positions: [number, number][] = locations.map(loc => [loc.latitude, loc.longitude]);
  
  // Get first and last positions for markers
  const startPosition = positions[0];
  const endPosition = positions[positions.length - 1];
  
  // Calculate statistics
  const avgSpeed = locations.length > 0 
    ? locations.reduce((sum, loc) => sum + (loc.speed || 0), 0) / locations.filter(l => l.speed).length 
    : 0;
  
  const duration = locations.length > 1
    ? new Date(locations[locations.length - 1].recorded_at).getTime() - new Date(locations[0].recorded_at).getTime()
    : 0;
  
  const durationMinutes = Math.round(duration / 60000);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            {onClose && <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-destructive/10">
                <MapPin className="h-5 w-5 text-destructive" />
              </div>
              GPS-трек рейса
            </CardTitle>
            {onClose && <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>}
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchLocations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (locations.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              GPS-трек рейса
            </CardTitle>
            {onClose && <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>}
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Navigation className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>GPS-данные отсутствуют</p>
          <p className="text-sm mt-1">Трек будет отображен после начала движения водителем</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            GPS-трек рейса
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLocations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-wrap gap-3 mt-3">
          <Badge variant="outline" className="gap-1.5">
            <Navigation className="h-3.5 w-3.5" />
            {locations.length} точек
          </Badge>
          {avgSpeed > 0 && (
            <Badge variant="outline" className="gap-1.5">
              <Gauge className="h-3.5 w-3.5" />
              {avgSpeed.toFixed(1)} км/ч (ср.)
            </Badge>
          )}
          {durationMinutes > 0 && (
            <Badge variant="outline" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {durationMinutes} мин
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] w-full">
          <MapContainer
            center={startPosition || [55.7558, 37.6173]}
            zoom={13}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Track polyline */}
            <Polyline
              positions={positions}
              pathOptions={{ color: 'hsl(var(--primary))', weight: 4, opacity: 0.8 }}
            />
            
            {/* Start marker */}
            {startPosition && (
              <Marker position={startPosition} icon={startIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>Начало трека</strong>
                    <p className="text-muted-foreground">
                      {format(new Date(locations[0].recorded_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                    </p>
                    {locations[0].speed && (
                      <p>Скорость: {locations[0].speed.toFixed(1)} км/ч</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* End marker (only if different from start) */}
            {endPosition && positions.length > 1 && (
              <Marker position={endPosition} icon={endIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>Конец трека</strong>
                    <p className="text-muted-foreground">
                      {format(new Date(locations[locations.length - 1].recorded_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                    </p>
                    {locations[locations.length - 1].speed && (
                      <p>Скорость: {locations[locations.length - 1].speed.toFixed(1)} км/ч</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Fit bounds to track */}
            <FitBounds positions={positions} />
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};
