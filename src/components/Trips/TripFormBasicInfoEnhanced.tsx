import React from 'react';
import { Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { Contractor, Route, TripStatus } from '@/types';
import { RequiredLabel } from '@/components/ui/required-label';
import { SelectedBadge } from '@/components/ui/selected-badge';

interface TripFormBasicInfoEnhancedProps {
  control: Control<TripFormData>;
  contractors: Contractor[];
  routes: Route[];
  onRouteChange: (routeId: string) => void;
  selectedRouteId: string | null;
}

export const TripFormBasicInfoEnhanced: React.FC<TripFormBasicInfoEnhancedProps> = ({
  control,
  contractors,
  routes,
  onRouteChange,
  selectedRouteId
}) => {
  const selectedRoute = routes.find(r => r.id === selectedRouteId);

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
                <RequiredLabel required>Статус</RequiredLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}>
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
                <RequiredLabel required>Контрагент</RequiredLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <RequiredLabel>Выбрать маршрут (опционально)</RequiredLabel>
            <SelectedBadge selected={!!selectedRouteId}>
              Маршрут: {selectedRoute?.name}
            </SelectedBadge>
          </div>
          <Select onValueChange={onRouteChange} value={selectedRouteId || undefined}>
            <FormControl>
              <SelectTrigger className={selectedRouteId ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}>
                <div className="flex items-center gap-2">
                  {selectedRouteId && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  <SelectValue placeholder="Выберите готовый маршрут" />
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {route.name} ({route.pointA} → {route.pointB})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="pointA"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Пункт отправления</RequiredLabel>
                <FormControl>
                  <Input 
                    placeholder="г. Москва" 
                    {...field} 
                    className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
                  />
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
                <RequiredLabel required>Пункт назначения</RequiredLabel>
                <FormControl>
                  <Input 
                    placeholder="г. Санкт-Петербург" 
                    {...field}
                    className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
                  />
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
                <RequiredLabel required>Дата отправления</RequiredLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
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
                <RequiredLabel>Дата прибытия (опционально)</RequiredLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
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
