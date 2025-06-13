
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trip } from '@/types';
import { TripExpenses } from './TripExpenses';
import { Calendar, User, Truck, Package, MapPin, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripDetailsProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  planned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500'
};

const statusLabels = {
  planned: 'Планируется',
  in_progress: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён'
};

export const TripDetails: React.FC<TripDetailsProps> = ({ trip, open, onOpenChange }) => {
  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[trip.status]}`}></div>
            <span>{trip.pointA} → {trip.pointB}</span>
            <Badge variant="outline">{statusLabels[trip.status]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Детали рейса</TabsTrigger>
            <TabsTrigger value="expenses">Расходы</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Даты
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Отправление:</span>
                    <p className="text-sm text-muted-foreground">
                      {format(trip.departureDate, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  {trip.arrivalDate && (
                    <div>
                      <span className="font-medium">Прибытие:</span>
                      <p className="text-sm text-muted-foreground">
                        {format(trip.arrivalDate, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Водитель
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Имя:</span>
                    <p className="text-sm text-muted-foreground">{trip.driver.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Телефон:</span>
                    <p className="text-sm text-muted-foreground">{trip.driver.phone}</p>
                  </div>
                  {trip.driver.license && (
                    <div>
                      <span className="font-medium">Удостоверение:</span>
                      <p className="text-sm text-muted-foreground">{trip.driver.license}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Транспорт
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Марка/Модель:</span>
                    <p className="text-sm text-muted-foreground">
                      {trip.vehicle.brand} {trip.vehicle.model}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Гос. номер:</span>
                    <p className="text-sm text-muted-foreground">{trip.vehicle.licensePlate}</p>
                  </div>
                  {trip.vehicle.capacity && (
                    <div>
                      <span className="font-medium">Грузоподъемность:</span>
                      <p className="text-sm text-muted-foreground">{trip.vehicle.capacity} кг</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Груз
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Описание:</span>
                    <p className="text-sm text-muted-foreground">{trip.cargo.description}</p>
                  </div>
                  <div>
                    <span className="font-medium">Вес:</span>
                    <p className="text-sm text-muted-foreground">{trip.cargo.weight} кг</p>
                  </div>
                  <div>
                    <span className="font-medium">Объем:</span>
                    <p className="text-sm text-muted-foreground">{trip.cargo.volume} м³</p>
                  </div>
                  {trip.cargo.value && (
                    <div>
                      <span className="font-medium">Стоимость:</span>
                      <p className="text-sm text-muted-foreground">
                        {trip.cargo.value.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {trip.comments && (
              <Card>
                <CardHeader>
                  <CardTitle>Комментарии</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{trip.comments}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expenses">
            <TripExpenses tripId={trip.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
