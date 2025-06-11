
import React from 'react';
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

  const onSubmit = async (values: z.infer<typeof cargoTypeSchema>) => {
    try {
      const cargoTypeData: CargoType = {
        id: cargoType?.id || crypto.randomUUID(),
        name: values.name,
        description: values.description,
        defaultWeight: values.defaultWeight,
        defaultVolume: values.defaultVolume,
        hazardous: values.hazardous,
        temperatureControlled: values.temperatureControlled,
        fragile: values.fragile,
        createdAt: cargoType?.createdAt || new Date(),
        updatedAt: new Date()
      };

      await supabaseService.saveCargoType(cargoTypeData);
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
