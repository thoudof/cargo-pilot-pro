
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { Driver } from '@/types';

const driverSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  phone: z.string().min(1, 'Телефон обязателен'),
  license: z.string().optional(),
  passportData: z.string().optional(),
  experienceYears: z.number().optional(),
  notes: z.string().optional()
});

interface DriverFormProps {
  driver?: Driver;
  onSave: () => void;
  onCancel: () => void;
}

export const DriverForm: React.FC<DriverFormProps> = ({ driver, onSave, onCancel }) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof driverSchema>>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: driver?.name || '',
      phone: driver?.phone || '',
      license: driver?.license || '',
      passportData: driver?.passportData || '',
      experienceYears: driver?.experienceYears || 0,
      notes: driver?.notes || ''
    }
  });

  const onSubmit = async (values: z.infer<typeof driverSchema>) => {
    try {
      // Подготавливаем данные в формате snake_case для Supabase
      const driverData = {
        name: values.name,
        phone: values.phone,
        license: values.license || null,
        passport_data: values.passportData || null,
        experience_years: values.experienceYears || null,
        notes: values.notes || null
      };

      console.log('Saving driver data:', driverData);

      let result;
      if (driver?.id) {
        result = await supabaseService.supabase
          .from('drivers')
          .update(driverData)
          .eq('id', driver.id)
          .select();
      } else {
        result = await supabaseService.supabase
          .from('drivers')
          .insert(driverData)
          .select();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      console.log('Driver saved successfully:', result.data);

      toast({
        title: driver ? 'Водитель обновлен' : 'Водитель создан',
        description: `${values.name} успешно ${driver ? 'обновлен' : 'создан'}`
      });
      onSave();
    } catch (error) {
      console.error('Failed to save driver:', error);
      toast({
        title: 'Ошибка',
        description: `Не удалось сохранить водителя: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{driver ? 'Редактировать водителя' : 'Добавить водителя'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя водителя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input placeholder="+7 (999) 999-99-99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория прав</FormLabel>
                  <FormControl>
                    <Input placeholder="B, C, D, E" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passportData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Паспортные данные</FormLabel>
                  <FormControl>
                    <Input placeholder="Серия и номер паспорта" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experienceYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Опыт работы (лет)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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
                {driver ? 'Обновить' : 'Создать'}
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
