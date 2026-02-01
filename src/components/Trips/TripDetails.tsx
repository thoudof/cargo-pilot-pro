import React, { useState } from 'react';
import { TripDocuments } from './TripDocuments';
import { TripLocationMap } from './TripLocationMap';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Truck, Package, MapPin, FileText, DollarSign, Navigation, Save } from 'lucide-react';
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
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const { hasPermission, hasRole } = useAuth();
  
  // Show map for dispatchers and admins
  const canViewMap = hasPermission(AppPermission.VIEW_TRIPS) || hasRole('admin') || hasRole('dispatcher');
  const canEditTrips = hasPermission(AppPermission.EDIT_TRIPS);

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${statusColors[trip.status]}`}></div>
              <span className="truncate">{trip.pointA} → {trip.pointB}</span>
              <Badge variant="outline" className="w-fit">{statusLabels[trip.status]}</Badge>
            </div>
            {canEditTrips && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowSaveTemplate(true)}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Сохранить как шаблон</span>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Основная информация */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      Отправление
                    </div>
                    <p className="font-medium text-sm sm:text-base">{trip.pointA}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {format(trip.departureDate, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      Назначение
                    </div>
                    <p className="font-medium text-sm sm:text-base">{trip.pointB}</p>
                    {trip.arrivalDate && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {format(trip.arrivalDate, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Водитель */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Водитель
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 sm:space-y-2">
                  <p className="font-medium text-sm sm:text-base">{trip.driver.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{trip.driver.phone}</p>
                  {trip.driver.license && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Удостоверение: {trip.driver.license}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Транспорт */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                  Транспорт
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 sm:space-y-2">
                  <p className="font-medium text-sm sm:text-base">
                    {trip.vehicle.brand} {trip.vehicle.model}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Гос. номер: {trip.vehicle.licensePlate}
                  </p>
                  {trip.vehicle.capacity && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Грузоподъемность: {trip.vehicle.capacity} тонн
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Груз */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  Груз
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <p className="font-medium text-sm sm:text-base">{trip.cargo.description}</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Стоимость:</span>
                      <span className="font-medium text-sm">
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
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    Комментарии
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm">{trip.comments}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
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

        <SaveAsTemplateDialog 
          trip={trip} 
          open={showSaveTemplate} 
          onOpenChange={setShowSaveTemplate} 
        />
      </DialogContent>
    </Dialog>
  );
};
