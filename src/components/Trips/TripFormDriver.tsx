
import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { Driver } from '@/types';

interface TripFormDriverProps {
  control: Control<TripFormData>;
  setValue: UseFormSetValue<TripFormData>;
  drivers: Driver[];
}

export const TripFormDriver: React.FC<TripFormDriverProps> = ({
  control,
  setValue,
  drivers
}) => {
  const handleDriverChange = (driverId: string) => {
    const selectedDriver = drivers.find(d => d.id === driverId);
    if (selectedDriver) {
      setValue('driver.name', selectedDriver.name);
      setValue('driver.phone', selectedDriver.phone);
      setValue('driver.license', selectedDriver.license || '');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Водитель
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormItem>
          <FormLabel>Выбрать водителя</FormLabel>
          <Select onValueChange={handleDriverChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Выберите водителя из списка" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="driver.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имя водителя</FormLabel>
                <FormControl>
                  <Input placeholder="Иван Петров" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="driver.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Телефон</FormLabel>
                <FormControl>
                  <Input placeholder="+7 (999) 123-45-67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="driver.license"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер водительского удостоверения</FormLabel>
              <FormControl>
                <Input placeholder="1234 567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
