
import React from 'react';
import { Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { Contractor, Route, TripStatus } from '@/types';

interface TripFormBasicInfoProps {
  control: Control<TripFormData>;
  contractors: Contractor[];
  routes: Route[];
  onRouteChange: (routeId: string) => void;
}

export const TripFormBasicInfo: React.FC<TripFormBasicInfoProps> = ({
  control,
  contractors,
  routes,
  onRouteChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Основная информация
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Статус</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TripStatus.PLANNED}>Запланирован</SelectItem>
                    <SelectItem value={TripStatus.IN_PROGRESS}>В пути</SelectItem>
                    <SelectItem value={TripStatus.COMPLETED}>Завершен</SelectItem>
                    <SelectItem value={TripStatus.CANCELLED}>Отменен</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="contractorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Контрагент</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите контрагента" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem>
          <FormLabel>Выбрать маршрут (опционально)</FormLabel>
          <Select onValueChange={onRouteChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Выберите готовый маршрут" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.name} ({route.pointA} → {route.pointB})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="pointA"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пункт отправления</FormLabel>
                <FormControl>
                  <Input placeholder="г. Москва" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="pointB"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пункт назначения</FormLabel>
                <FormControl>
                  <Input placeholder="г. Санкт-Петербург" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="departureDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата отправления</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="arrivalDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата прибытия (опционально)</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
