
import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { CargoType } from '@/types';

interface TripFormCargoProps {
  control: Control<TripFormData>;
  setValue: UseFormSetValue<TripFormData>;
  cargoTypes: CargoType[];
}

export const TripFormCargo: React.FC<TripFormCargoProps> = ({
  control,
  setValue,
  cargoTypes
}) => {
  const handleCargoTypeChange = (cargoTypeId: string) => {
    const selectedCargoType = cargoTypes.find(c => c.id === cargoTypeId);
    if (selectedCargoType) {
      setValue('cargo.description', selectedCargoType.name);
      if (selectedCargoType.defaultWeight) {
        setValue('cargo.weight', selectedCargoType.defaultWeight);
      }
      if (selectedCargoType.defaultVolume) {
        setValue('cargo.volume', selectedCargoType.defaultVolume);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Груз
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormItem>
          <FormLabel>Выбрать тип груза (опционально)</FormLabel>
          <Select onValueChange={handleCargoTypeChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип груза" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {cargoTypes.map((cargoType) => (
                <SelectItem key={cargoType.id} value={cargoType.id}>
                  {cargoType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        <FormField
          control={control}
          name="cargo.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание груза</FormLabel>
              <FormControl>
                <Textarea placeholder="Металлические изделия" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="cargo.weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Вес (тонн)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="15.5" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="cargo.volume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Объем (м³)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="50" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="cargo.value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Стоимость (руб.)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="500000" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
