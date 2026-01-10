import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, CheckCircle2, Weight } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { Vehicle } from '@/types';
import { RequiredLabel } from '@/components/ui/required-label';
import { SelectedBadge } from '@/components/ui/selected-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TripFormVehicleEnhancedProps {
  control: Control<TripFormData>;
  setValue: UseFormSetValue<TripFormData>;
  vehicles: Vehicle[];
  onVehicleChange: (vehicleId: string) => void;
  selectedVehicleId: string | null;
}

export const TripFormVehicleEnhanced: React.FC<TripFormVehicleEnhancedProps> = ({
  control,
  setValue,
  vehicles,
  onVehicleChange,
  selectedVehicleId
}) => {
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Транспорт
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <RequiredLabel>Выбрать транспорт из справочника</RequiredLabel>
            <SelectedBadge selected={!!selectedVehicleId}>
              {selectedVehicle?.brand} {selectedVehicle?.model}
            </SelectedBadge>
          </div>
          <Select onValueChange={onVehicleChange} value={selectedVehicleId || undefined}>
            <FormControl>
              <SelectTrigger className={selectedVehicleId ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}>
                <div className="flex items-center gap-2">
                  {selectedVehicleId && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  <SelectValue placeholder="Выберите транспорт из списка" />
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {vehicle.brand} {vehicle.model}
                    <span className="text-muted-foreground">({vehicle.licensePlate})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVehicleId && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Данные транспорта <strong>{selectedVehicle?.brand} {selectedVehicle?.model}</strong> загружены из справочника
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="vehicle.brand"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Марка</RequiredLabel>
                <FormControl>
                  <Input 
                    placeholder="MAN" 
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
            name="vehicle.model"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Модель</RequiredLabel>
                <FormControl>
                  <Input 
                    placeholder="TGX 18.440" 
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
            name="vehicle.licensePlate"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>Гос. номер</RequiredLabel>
                <FormControl>
                  <Input 
                    placeholder="А123БВ777" 
                    {...field}
                    className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="vehicle.capacity"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>
                <span className="flex items-center gap-1">
                  <Weight className="h-3 w-3" />
                  Грузоподъемность (тонн) - опционально
                </span>
              </RequiredLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="20" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
