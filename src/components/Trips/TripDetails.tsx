import React, { useState } from 'react';
import { TripDocuments } from './TripDocuments';
import { TripLocationMap } from './TripLocationMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Truck, Package, MapPin, FileText, DollarSign, Navigation } from 'lucide-react';
import { Trip, TripStatus, AppPermission } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TripExpenses } from './TripExpenses';
import { TripExpensesSummary } from './TripExpensesSummary';
import { useAuth } from '@/components/Auth/AuthProvider';

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

interface TripDetailsProps {
  trip?: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TripDetails: React.FC<TripDetailsProps> = ({
  trip,
  open,
  onOpenChange
}) => {
  const [showMap, setShowMap] = useState(false);
  const { hasPermission, hasRole } = useAuth();
  
  // Show map for dispatchers and admins
  const canViewMap = hasPermission(AppPermission.VIEW_TRIPS) || hasRole('admin') || hasRole('dispatcher');

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${statusColors[trip.status]}`}></div>
            {trip.pointA} → {trip.pointB}
            <Badge variant="outline">{statusLabels[trip.status]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      Отправление
                    </div>
                    <p className="font-medium">{trip.pointA}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(trip.departureDate, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      Назначение
                    </div>
                    <p className="font-medium">{trip.pointB}</p>
                    {trip.arrivalDate && (
                      <p className="text-sm text-muted-foreground">
                        {format(trip.arrivalDate, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Водитель */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Водитель
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{trip.driver.name}</p>
                  <p className="text-sm text-muted-foreground">{trip.driver.phone}</p>
                  {trip.driver.license && (
                    <p className="text-sm text-muted-foreground">
                      Удостоверение: {trip.driver.license}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Транспорт */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Транспорт
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">
                    {trip.vehicle.brand} {trip.vehicle.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Гос. номер: {trip.vehicle.licensePlate}
                  </p>
                  {trip.vehicle.capacity && (
                    <p className="text-sm text-muted-foreground">
                      Грузоподъемность: {trip.vehicle.capacity} тонн
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Груз */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Груз
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="font-medium">{trip.cargo.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Вес:</span>
                      <p className="font-medium">{trip.cargo.weight} тонн</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Объем:</span>
                      <p className="font-medium">{trip.cargo.volume} м³</p>
                    </div>
                  </div>
                  {trip.cargo.value && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Стоимость:</span>
                      <span className="font-medium">
                        {trip.cargo.value.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Комментарии */}
            {trip.comments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Комментарии
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{trip.comments}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* GPS-трек карта */}
            {canViewMap && (
              showMap ? (
                <TripLocationMap tripId={trip.id} onClose={() => setShowMap(false)} />
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setShowMap(true)}
                    >
                      <Navigation className="h-4 w-4" />
                      Показать GPS-трек на карте
                    </Button>
                  </CardContent>
                </Card>
              )
            )}

            {/* Сводка расходов */}
            <TripExpensesSummary tripId={trip.id} />

            {/* Полное управление расходами */}
            <TripExpenses tripId={trip.id} />

            {/* Документы рейса */}
            <TripDocuments tripId={trip.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
