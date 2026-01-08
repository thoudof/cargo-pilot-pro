import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { tripSchema, TripFormData } from '@/lib/validations';
import { Trip, Contractor, Driver, Vehicle, TripStatus, Route, CargoType } from '@/types';
import { ExpenseType } from '@/types/expenses';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { TripFormBasicInfo } from './TripFormBasicInfo';
import { TripFormDriver } from './TripFormDriver';
import { TripFormVehicle } from './TripFormVehicle';
import { TripFormCargo } from './TripFormCargo';
import { TripFormExpenses } from './TripFormExpenses';

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

  useEffect(() => {
    if (open) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
      loadData();
      
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
      const formattedExpenses = expensesData.map((expense: any) => ({
        expenseType: expense.category as ExpenseType,
        amount: expense.amount.toString(),
        description: expense.description || '',
        expenseDate: new Date(expense.date).toISOString().split('T')[0]
      }));
      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Failed to load trip expenses:', error);
    }
  };

  const handleRouteChange = (routeId: string) => {
    const selectedRoute = routes.find(r => r.id === routeId);
    if (selectedRoute) {
      form.setValue('pointA', selectedRoute.pointA);
      form.setValue('pointB', selectedRoute.pointB);
    }
  };

  const onSubmit = async (data: TripFormData) => {
    setLoading(true);
    try {
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
        documents: data.documents || []
      };

      console.log('Saving trip data:', tripData);

      let result;
      if (trip?.id) {
        result = await supabaseService.supabase
          .from('trips')
          .update(tripData)
          .eq('id', trip.id)
          .select();
      } else {
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
        if (trip?.id) {
          await supabaseService.supabase
            .from('trip_expenses')
            .delete()
            .eq('trip_id', trip.id);
        }

        // Use correct column names: category instead of expense_type, date instead of expense_date
        const expensesToSave = expenses
          .filter(expense => expense.amount && parseFloat(expense.amount) > 0)
          .map(expense => ({
            trip_id: savedTrip.id,
            category: expense.expenseType,
            amount: parseFloat(expense.amount),
            description: expense.description || null,
            date: new Date(expense.expenseDate).toISOString(),
            created_by: user.id
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
            <TripFormBasicInfo
              control={form.control}
              contractors={contractors}
              routes={routes}
              onRouteChange={handleRouteChange}
            />

            <TripFormDriver
              control={form.control}
              setValue={form.setValue}
              drivers={drivers}
            />

            <TripFormVehicle
              control={form.control}
              setValue={form.setValue}
              vehicles={vehicles}
            />

            <TripFormCargo
              control={form.control}
              setValue={form.setValue}
              cargoTypes={cargoTypes}
            />

            <TripFormExpenses
              expenses={expenses}
              onExpensesChange={setExpenses}
            />

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
