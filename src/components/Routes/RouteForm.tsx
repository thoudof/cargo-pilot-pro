
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
import { Route } from '@/types';

const routeSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  pointA: z.string().min(1, 'Точка отправления обязательна'),
  pointB: z.string().min(1, 'Точка назначения обязательна'),
  distanceKm: z.number().optional(),
  estimatedDurationHours: z.number().optional(),
  notes: z.string().optional()
});

interface RouteFormProps {
  route?: Route;
  onSave: () => void;
  onCancel: () => void;
}

export const RouteForm: React.FC<RouteFormProps> = ({ route, onSave, onCancel }) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof routeSchema>>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: route?.name || '',
      pointA: route?.pointA || '',
      pointB: route?.pointB || '',
      distanceKm: route?.distanceKm || 0,
      estimatedDurationHours: route?.estimatedDurationHours || 0,
      notes: route?.notes || ''
    }
  });

  const onSubmit = async (values: z.infer<typeof routeSchema>) => {
    try {
      const routeData: Route = {
        id: route?.id || crypto.randomUUID(),
        name: values.name,
        pointA: values.pointA,
        pointB: values.pointB,
        distanceKm: values.distanceKm,
        estimatedDurationHours: values.estimatedDurationHours,
        notes: values.notes,
        createdAt: route?.createdAt || new Date(),
        updatedAt: new Date()
      };

      await supabaseService.saveRoute(routeData);
      toast({
        title: route ? 'Маршрут обновлен' : 'Маршрут создан',
        description: `${values.name} успешно ${route ? 'обновлен' : 'создан'}`
      });
      onSave();
    } catch (error) {
      console.error('Failed to save route:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить маршрут',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{route ? 'Редактировать маршрут' : 'Добавить маршрут'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название маршрута</FormLabel>
                  <FormControl>
                    <Input placeholder="Москва - Санкт-Петербург" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pointA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Точка отправления</FormLabel>
                    <FormControl>
                      <Input placeholder="Москва" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pointB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Точка назначения</FormLabel>
                    <FormControl>
                      <Input placeholder="Санкт-Петербург" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="distanceKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Расстояние (км)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="635" 
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
                name="estimatedDurationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Время в пути (ч)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.5"
                        placeholder="8" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечания</FormLabel>
                  <FormControl>
                    <Input placeholder="Дополнительная информация о маршруте" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {route ? 'Обновить' : 'Создать'}
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
