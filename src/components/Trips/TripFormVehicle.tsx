
import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { Vehicle } from '@/types';

interface TripFormVehicleProps {
  control: Control<TripFormData>;
  setValue: UseFormSetValue<TripFormData>;
  vehicles: Vehicle[];
}

export const TripFormVehicle: React.FC<TripFormVehicleProps> = ({
  control,
  setValue,
  vehicles
}) => {
  const handleVehicleChange = (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      setValue('vehicle.brand', selectedVehicle.brand);
      setValue('vehicle.model', selectedVehicle.model);
      setValue('vehicle.licensePlate', selectedVehicle.licensePlate);
      setValue('vehicle.capacity', selectedVehicle.capacity);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Транспорт
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormItem>
          <FormLabel>Выбрать транспорт</FormLabel>
          <Select onValueChange={handleVehicleChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Выберите транспорт из списка" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="vehicle.brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Марка</FormLabel>
                <FormControl>
                  <Input placeholder="MAN" {...field} />
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
                <FormLabel>Модель</FormLabel>
                <FormControl>
                  <Input placeholder="TGX 18.440" {...field} />
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
                <FormLabel>Гос. номер</FormLabel>
                <FormControl>
                  <Input placeholder="А123БВ777" {...field} />
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
              <FormLabel>Грузоподъемность (тонн)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="20" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
