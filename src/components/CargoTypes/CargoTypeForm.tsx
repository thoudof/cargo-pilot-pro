import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { CargoType } from '@/types';
import { getCurrentCompanyId } from '@/lib/companyContext';

const cargoTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  defaultWeight: z.number().optional(),
  defaultVolume: z.number().optional(),
  hazardous: z.boolean().default(false),
  temperatureControlled: z.boolean().default(false),
  fragile: z.boolean().default(false)
});

interface CargoTypeFormProps {
  cargoType?: CargoType;
  onSave: () => void;
  onCancel: () => void;
}

export const CargoTypeForm: React.FC<CargoTypeFormProps> = ({ cargoType, onSave, onCancel }) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof cargoTypeSchema>>({
    resolver: zodResolver(cargoTypeSchema),
    defaultValues: {
      name: cargoType?.name || '',
      description: cargoType?.description || '',
      defaultWeight: cargoType?.defaultWeight || 0,
      defaultVolume: cargoType?.defaultVolume || 0,
      hazardous: cargoType?.hazardous || false,
      temperatureControlled: cargoType?.temperatureControlled || false,
      fragile: cargoType?.fragile || false
    }
  });

  // Reset form when cargoType changes
  useEffect(() => {
    form.reset({
      name: cargoType?.name || '',
      description: cargoType?.description || '',
      defaultWeight: cargoType?.defaultWeight || 0,
      defaultVolume: cargoType?.defaultVolume || 0,
      hazardous: cargoType?.hazardous || false,
      temperatureControlled: cargoType?.temperatureControlled || false,
      fragile: cargoType?.fragile || false
    });
  }, [cargoType, form]);
  const onSubmit = async (values: z.infer<typeof cargoTypeSchema>) => {
    try {
      // Подготавливаем данные в формате, который ожидает Supabase (snake_case)
      const cargoTypeData = {
        name: values.name,
        description: values.description || null,
        default_weight: values.defaultWeight || null,
        default_volume: values.defaultVolume || null,
        hazardous: values.hazardous,
        temperature_controlled: values.temperatureControlled,
        fragile: values.fragile
      };

      console.log('Saving cargo type data:', cargoTypeData);

      let result;
      if (cargoType?.id) {
        // Обновляем существующий тип груза
        result = await supabaseService.supabase
          .from('cargo_types')
          .update(cargoTypeData)
          .eq('id', cargoType.id)
          .select();
      } else {
        // Создаем новый тип груза
        const companyId = await getCurrentCompanyId();
        result = await supabaseService.supabase
          .from('cargo_types')
          .insert({ ...cargoTypeData, company_id: companyId })
          .select();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      console.log('Cargo type saved successfully:', result.data);

      toast({
        title: cargoType ? 'Тип груза обновлен' : 'Тип груза создан',
        description: `${values.name} успешно ${cargoType ? 'обновлен' : 'создан'}`
      });
      onSave();
    } catch (error) {
      console.error('Failed to save cargo type:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить тип груза',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cargoType ? 'Редактировать тип груза' : 'Добавить тип груза'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Продукты питания, Стройматериалы" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Input placeholder="Описание типа груза" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вес по умолчанию (т)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="1.5" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Объем по умолчанию (м³)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="2.5" 
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

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hazardous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Опасный груз</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Требует специальные разрешения и меры безопасности
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperatureControlled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Температурный режим</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Требует поддержания определенной температуры
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fragile"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Хрупкий груз</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Требует осторожного обращения
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {cargoType ? 'Обновить' : 'Создать'}
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
