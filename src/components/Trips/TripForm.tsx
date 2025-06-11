import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarIcon, Truck, User, Package } from 'lucide-react';
import { tripSchema, TripFormData } from '@/lib/validations';
import { Trip, Contractor, Driver, Vehicle, TripStatus, Route, CargoType } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface TripFormProps {
  trip?: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TripForm: React.FC<TripFormProps> = ({
  trip,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const { toast } = useToast();

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: trip || {
      id: '',
      status: TripStatus.PLANNED,
      departureDate: new Date(),
      arrivalDate: undefined,
      pointA: '',
      pointB: '',
      contractorId: '',
      driver: { name: '', phone: '', license: '' },
      vehicle: { brand: '', model: '', licensePlate: '', capacity: undefined },
      cargo: { description: '', weight: 0, volume: 0, value: undefined },
      comments: '',
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      changeLog: []
    }
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [contractorData, driverData, vehicleData, routeData, cargoTypeData] = await Promise.all([
        supabaseService.getContractors(),
        supabaseService.getDrivers(),
        supabaseService.getVehicles(),
        supabaseService.getRoutes(),
        supabaseService.getCargoTypes()
      ]);
      setContractors(contractorData);
      setDrivers(driverData);
      setVehicles(vehicleData);
      setRoutes(routeData);
      setCargoTypes(cargoTypeData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleDriverChange = (driverId: string) => {
    const selectedDriver = drivers.find(d => d.id === driverId);
    if (selectedDriver) {
      form.setValue('driver.name', selectedDriver.name);
      form.setValue('driver.phone', selectedDriver.phone);
      form.setValue('driver.license', selectedDriver.license || '');
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      form.setValue('vehicle.brand', selectedVehicle.brand);
      form.setValue('vehicle.model', selectedVehicle.model);
      form.setValue('vehicle.licensePlate', selectedVehicle.licensePlate);
      form.setValue('vehicle.capacity', selectedVehicle.capacity);
    }
  };

  const handleRouteChange = (routeId: string) => {
    const selectedRoute = routes.find(r => r.id === routeId);
    if (selectedRoute) {
      form.setValue('pointA', selectedRoute.pointA);
      form.setValue('pointB', selectedRoute.pointB);
    }
  };

  const handleCargoTypeChange = (cargoTypeId: string) => {
    const selectedCargoType = cargoTypes.find(c => c.id === cargoTypeId);
    if (selectedCargoType) {
      form.setValue('cargo.description', selectedCargoType.name);
      if (selectedCargoType.defaultWeight) {
        form.setValue('cargo.weight', selectedCargoType.defaultWeight);
      }
      if (selectedCargoType.defaultVolume) {
        form.setValue('cargo.volume', selectedCargoType.defaultVolume);
      }
    }
  };

  const onSubmit = async (data: TripFormData) => {
    setLoading(true);
    try {
      // Получаем текущего пользователя
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const selectedDriver = drivers.find(d => 
        d.name === data.driver.name && d.phone === data.driver.phone
      );
      const selectedVehicle = vehicles.find(v => 
        v.brand === data.vehicle.brand && 
        v.model === data.vehicle.model && 
        v.licensePlate === data.vehicle.licensePlate
      );

      // Подготавливаем данные в формате snake_case для базы данных
      const tripData = {
        status: data.status,
        departure_date: data.departureDate.toISOString(),
        arrival_date: data.arrivalDate ? data.arrivalDate.toISOString() : null,
        point_a: data.pointA,
        point_b: data.pointB,
        contractor_id: data.contractorId,
        driver_id: selectedDriver?.id || null,
        vehicle_id: selectedVehicle?.id || null,
        driver_name: data.driver.name,
        driver_phone: data.driver.phone,
        driver_license: data.driver.license || null,
        vehicle_brand: data.vehicle.brand,
        vehicle_model: data.vehicle.model,
        vehicle_license_plate: data.vehicle.licensePlate,
        vehicle_capacity: data.vehicle.capacity || null,
        cargo_description: data.cargo.description,
        cargo_weight: data.cargo.weight,
        cargo_volume: data.cargo.volume,
        cargo_value: data.cargo.value || null,
        comments: data.comments || null,
        documents: data.documents || [],
        user_id: user.id
      };

      console.log('Saving trip data:', tripData);

      let result;
      if (trip?.id) {
        // Обновляем существующий рейс
        result = await supabaseService.supabase
          .from('trips')
          .update(tripData)
          .eq('id', trip.id)
          .select();
      } else {
        // Создаем новый рейс
        result = await supabaseService.supabase
          .from('trips')
          .insert(tripData)
          .select();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      console.log('Trip saved successfully:', result.data);
      
      toast({
        title: trip ? 'Рейс обновлен' : 'Рейс создан',
        description: `Рейс ${data.pointA} → ${data.pointB} успешно ${trip ? 'обновлен' : 'создан'}`
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save trip:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить рейс',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {trip ? 'Редактировать рейс' : 'Создать рейс'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статус</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={TripStatus.PLANNED}>Запланирован</SelectItem>
                            <SelectItem value={TripStatus.IN_PROGRESS}>В пути</SelectItem>
                            <SelectItem value={TripStatus.COMPLETED}>Завершен</SelectItem>
                            <SelectItem value={TripStatus.CANCELLED}>Отменен</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Контрагент</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите контрагента" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractors.map((contractor) => (
                              <SelectItem key={contractor.id} value={contractor.id}>
                                {contractor.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormItem>
                  <FormLabel>Выбрать маршрут (опционально)</FormLabel>
                  <Select onValueChange={handleRouteChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите готовый маршрут" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name} ({route.pointA} → {route.pointB})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pointA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пункт отправления</FormLabel>
                        <FormControl>
                          <Input placeholder="г. Москва" {...field} />
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
                        <FormLabel>Пункт назначения</FormLabel>
                        <FormControl>
                          <Input placeholder="г. Санкт-Петербург" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата отправления</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата прибытия (опционально)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Водитель */}
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
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
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

            {/* Транспорт */}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
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

            {/* Груз */}
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
                  control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарии</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Дополнительные комментарии к рейсу..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : trip ? 'Обновить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
