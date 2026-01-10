import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, CheckCircle2, Weight, Box, Banknote } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { CargoType } from '@/types';
import { RequiredLabel } from '@/components/ui/required-label';
import { SelectedBadge } from '@/components/ui/selected-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TripFormCargoEnhancedProps {
  control: Control<TripFormData>;
  setValue: UseFormSetValue<TripFormData>;
  cargoTypes: CargoType[];
  onCargoTypeChange: (cargoTypeId: string) => void;
  selectedCargoTypeId: string | null;
}

export const TripFormCargoEnhanced: React.FC<TripFormCargoEnhancedProps> = ({
  control,
  setValue,
  cargoTypes,
  onCargoTypeChange,
  selectedCargoTypeId
}) => {
  const selectedCargoType = cargoTypes.find(c => c.id === selectedCargoTypeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Груз
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <RequiredLabel>Выбрать тип груза из справочника (опционально)</RequiredLabel>
            <SelectedBadge selected={!!selectedCargoTypeId}>
              {selectedCargoType?.name}
            </SelectedBadge>
          </div>
          <Select onValueChange={onCargoTypeChange} value={selectedCargoTypeId || undefined}>
            <FormControl>
              <SelectTrigger className={selectedCargoTypeId ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}>
                <div className="flex items-center gap-2">
                  {selectedCargoTypeId && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  <SelectValue placeholder="Выберите тип груза" />
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {cargoTypes.map((cargoType) => (
                <SelectItem key={cargoType.id} value={cargoType.id}>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {cargoType.name}
                    {cargoType.hazardous && <span className="text-red-500 text-xs">⚠️ Опасный</span>}
                    {cargoType.fragile && <span className="text-yellow-500 text-xs">🔶 Хрупкий</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCargoTypeId && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Данные типа груза <strong>{selectedCargoType?.name}</strong> загружены из справочника
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={control}
          name="cargo.description"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel required>Описание груза</RequiredLabel>
              <FormControl>
                <Textarea 
                  placeholder="Металлические изделия" 
                  {...field}
                  className={field.value ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
                />
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
                <RequiredLabel required>
                  <span className="flex items-center gap-1">
                    <Weight className="h-3 w-3" />
                    Вес (тонн)
                  </span>
                </RequiredLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="15.5" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={field.value && field.value > 0 ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
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
                <RequiredLabel required>
                  <span className="flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    Объем (м³)
                  </span>
                </RequiredLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="50" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={field.value && field.value > 0 ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}
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
                <RequiredLabel>
                  <span className="flex items-center gap-1">
                    <Banknote className="h-3 w-3" />
                    Стоимость (руб.) - опционально
                  </span>
                </RequiredLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="500000" 
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
        </div>
      </CardContent>
    </Card>
  );
};
