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
import { Calendar, CalendarIcon, Truck, User, Package, Receipt, Plus, Trash2 } from 'lucide-react';
import { tripSchema, TripFormData } from '@/lib/validations';
import { Trip, Contractor, Driver, Vehicle, TripStatus, Route, CargoType } from '@/types';
import { ExpenseType, expenseTypeLabels } from '@/types/expenses';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface TripFormProps {
  trip?: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ExpenseFormData {
  expenseType: ExpenseType;
  amount: string;
  description: string;
  expenseDate: string;
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
  const [expenses, setExpenses] = useState<ExpenseFormData[]>([]);
  const { toast } = useToast();

  // Функция для получения значений по умолчанию
  const getDefaultValues = (): TripFormData => {
    if (trip) {
      return {
        id: trip.id || '',
        status: trip.status,
        departureDate: trip.departureDate ? new Date(trip.departureDate) : new Date(),
        arrivalDate: trip.arrivalDate ? new Date(trip.arrivalDate) : undefined,
        pointA: trip.pointA || '',
        pointB: trip.pointB || '',
        contractorId: trip.contractorId || '',
        driver: {
          name: trip.driver?.name || '',
          phone: trip.driver?.phone || '',
          license: trip.driver?.license || ''
        },
        vehicle: {
          brand: trip.vehicle?.brand || '',
          model: trip.vehicle?.model || '',
          licensePlate: trip.vehicle?.licensePlate || '',
          capacity: trip.vehicle?.capacity
        },
        cargo: {
          description: trip.cargo?.description || '',
          weight: trip.cargo?.weight || 0,
          volume: trip.cargo?.volume || 0,
          value: trip.cargo?.value
        },
        comments: trip.comments || '',
        documents: trip.documents || [],
        createdAt: trip.createdAt ? new Date(trip.createdAt) : new Date(),
        updatedAt: trip.updatedAt ? new Date(trip.updatedAt) : new Date(),
        changeLog: trip.changeLog || []
      };
    }
    
    return {
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
    };
  };

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: getDefaultValues()
  });

  // Сброс формы при изменении trip
  useEffect(() => {
    if (open) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
      loadData();
      
      // Загружаем расходы если редактируем существующий рейс
      if (trip?.id) {
        loadTripExpenses(trip.id);
      } else {
        setExpenses([]);
      }
    }
  }, [open, trip]);

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

  const loadTripExpenses = async (tripId: string) => {
    try {
      const expensesData = await supabaseService.getTripExpenses(tripId);
      const formattedExpenses = expensesData.map(expense => ({
        expenseType: expense.expenseType,
        amount: expense.amount.toString(),
        description: expense.description || '',
        expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0]
      }));
      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Failed to load trip expenses:', error);
    }
  };

  const addExpense = () => {
    setExpenses([...expenses, {
      expenseType: ExpenseType.FUEL,
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0]
    }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: keyof ExpenseFormData, value: string) => {
    const updatedExpenses = [...expenses];
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value };
    setExpenses(updatedExpenses);
  };

  // Сброс расходов при изменении trip
  useEffect(() => {
    if (open) {
      if (trip?.id) {
        loadTripExpenses(trip.id);
      } else {
        setExpenses([]);
      }
    }
  }, [open, trip]);

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

      const savedTrip = result.data[0];

      // Сохраняем расходы
      if (expenses.length > 0) {
        // Если редактируем рейс, сначала удаляем старые расходы
        if (trip?.id) {
          await supabaseService.supabase
            .from('trip_expenses')
            .delete()
            .eq('trip_id', trip.id);
        }

        // Добавляем новые расходы
        const expensesToSave = expenses
          .filter(expense => expense.amount && parseFloat(expense.amount) > 0)
          .map(expense => ({
            trip_id: savedTrip.id,
            expense_type: expense.expenseType,
            amount: parseFloat(expense.amount),
            description: expense.description || null,
            expense_date: new Date(expense.expenseDate).toISOString(),
            user_id: user.id
          }));

        if (expensesToSave.length > 0) {
          const expensesResult = await supabaseService.supabase
            .from('trip_expenses')
            .insert(expensesToSave);

          if (expensesResult.error) {
            console.error('Failed to save expenses:', expensesResult.error);
            toast({
              title: 'Предупреждение',
              description: 'Рейс сохранен, но не удалось сохранить расходы',
              variant: 'destructive'
            });
          }
        }
      }

      console.log('Trip saved successfully:', result.data);
      
      toast({
        title: trip ? 'Рейс обновлен' : 'Рейс создан',
        description: `Рейс ${data.pointA} → ${data.pointB} успешно ${trip ? 'обновлен' : 'создан'}`
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
      setExpenses([]);
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

  const totalExpenses = expenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.amount) || 0;
    return sum + amount;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Расходы */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Расходы по рейсу
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      Итого: {totalExpenses.toLocaleString('ru-RU')} ₽
                    </span>
                    <Button type="button" onClick={addExpense} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить расход
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Расходы не добавлены</p>
                    <Button type="button" onClick={addExpense} variant="outline" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить первый расход
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {expenses.map((expense, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium">Тип расхода</label>
                            <Select
                              value={expense.expenseType}
                              onValueChange={(value) => updateExpense(index, 'expenseType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(expenseTypeLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Сумма (₽)</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={expense.amount}
                              onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Дата</label>
                            <Input
                              type="date"
                              value={expense.expenseDate}
                              onChange={(e) => updateExpense(index, 'expenseDate', e.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeExpense(index)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium">Описание</label>
                          <Textarea
                            placeholder="Дополнительное описание расхода..."
                            value={expense.description}
                            onChange={(e) => updateExpense(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
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
