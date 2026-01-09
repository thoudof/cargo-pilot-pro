import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types';

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Марка обязательна'),
  model: z.string().min(1, 'Модель обязательна'),
  licensePlate: z.string().min(1, 'Гос. номер обязателен'),
  capacity: z.number().min(0).optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  vin: z.string().optional(),
  registrationCertificate: z.string().optional(),
  insurancePolicy: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  technicalInspectionExpiry: z.string().optional(),
  notes: z.string().optional()
});

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSave: () => void;
  onCancel: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onSave, onCancel }) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: vehicle?.brand || '',
      model: vehicle?.model || '',
      licensePlate: vehicle?.licensePlate || '',
      capacity: vehicle?.capacity || undefined,
      year: vehicle?.year || undefined,
      vin: vehicle?.vin || '',
      registrationCertificate: vehicle?.registrationCertificate || '',
      insurancePolicy: vehicle?.insurancePolicy || '',
      insuranceExpiry: vehicle?.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0] : '',
      technicalInspectionExpiry: vehicle?.technicalInspectionExpiry ? new Date(vehicle.technicalInspectionExpiry).toISOString().split('T')[0] : '',
      notes: vehicle?.notes || ''
    }
  });

  const onSubmit = async (values: z.infer<typeof vehicleSchema>) => {
    try {
      // Подготавливаем данные в формате, который ожидает Supabase (snake_case)
      const vehicleData = {
        brand: values.brand,
        model: values.model,
        license_plate: values.licensePlate,
        capacity: values.capacity || null,
        year: values.year || null,
        vin: values.vin || null,
        registration_certificate: values.registrationCertificate || null,
        insurance_policy: values.insurancePolicy || null,
        insurance_expiry: values.insuranceExpiry || null,
        technical_inspection_expiry: values.technicalInspectionExpiry || null,
        notes: values.notes || null
      };

      console.log('Saving vehicle data:', vehicleData);

      let result;
      if (vehicle?.id) {
        // Обновляем существующий транспорт
        result = await supabaseService.supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id)
          .select();
      } else {
        // Создаем новый транспорт
        result = await supabaseService.supabase
          .from('vehicles')
          .insert(vehicleData)
          .select();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      console.log('Vehicle saved successfully:', result.data);

      toast({
        title: vehicle ? 'Транспорт обновлен' : 'Транспорт создан',
        description: `${values.brand} ${values.model} успешно ${vehicle ? 'обновлен' : 'создан'}`
      });
      onSave();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить транспорт',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehicle ? 'Редактировать транспорт' : 'Добавить транспорт'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Марка</FormLabel>
                    <FormControl>
                      <Input placeholder="Mercedes, Volvo, КамАЗ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Модель</FormLabel>
                    <FormControl>
                      <Input placeholder="Actros, FH, 5490" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Гос. номер</FormLabel>
                    <FormControl>
                      <Input placeholder="А123БВ123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Грузоподъемность (т)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="20" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Год выпуска</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2020" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN номер</FormLabel>
                    <FormControl>
                      <Input placeholder="1HGBH41JXMN109186" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="registrationCertificate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Свидетельство о регистрации</FormLabel>
                  <FormControl>
                    <Input placeholder="77 АА 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="insurancePolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Страховой полис</FormLabel>
                    <FormControl>
                      <Input placeholder="ААА 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок действия страховки</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="technicalInspectionExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок техосмотра</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечания</FormLabel>
                  <FormControl>
                    <Input placeholder="Дополнительная информация" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {vehicle ? 'Обновить' : 'Создать'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Отмена
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
