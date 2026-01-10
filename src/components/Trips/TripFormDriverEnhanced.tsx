import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, CheckCircle2, Phone, CreditCard } from 'lucide-react';
import { TripFormData } from '@/lib/validations';
import { Driver } from '@/types';
import { RequiredLabel } from '@/components/ui/required-label';
import { SelectedBadge } from '@/components/ui/selected-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TripFormDriverEnhancedProps {
  control: Control<TripFormData>;
  setValue: UseFormSetValue<TripFormData>;
  drivers: Driver[];
  onDriverChange: (driverId: string) => void;
  selectedDriverId: string | null;
}

export const TripFormDriverEnhanced: React.FC<TripFormDriverEnhancedProps> = ({
  control,
  setValue,
  drivers,
  onDriverChange,
  selectedDriverId
}) => {
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Водитель
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <RequiredLabel>Выбрать водителя из справочника</RequiredLabel>
            <SelectedBadge selected={!!selectedDriverId}>
              {selectedDriver?.name}
            </SelectedBadge>
          </div>
          <Select onValueChange={onDriverChange} value={selectedDriverId || undefined}>
            <FormControl>
              <SelectTrigger className={selectedDriverId ? 'border-green-300 bg-green-50 dark:bg-green-950' : ''}>
                <div className="flex items-center gap-2">
                  {selectedDriverId && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  <SelectValue placeholder="Выберите водителя из списка" />
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {driver.name}
                    <span className="text-muted-foreground">({driver.phone})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDriverId && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Данные водителя <strong>{selectedDriver?.name}</strong> загружены из справочника
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="driver.name"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Имя водителя
                  </span>
                </RequiredLabel>
                <FormControl>
                  <Input 
                    placeholder="Иван Петров" 
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
            name="driver.phone"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel required>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Телефон
                  </span>
                </RequiredLabel>
                <FormControl>
                  <Input 
                    placeholder="+7 (999) 123-45-67" 
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
          name="driver.license"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Номер водительского удостоверения (опционально)
                </span>
              </RequiredLabel>
              <FormControl>
                <Input 
                  placeholder="1234 567890" 
                  {...field}
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
