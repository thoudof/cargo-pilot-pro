import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tripSchema, TripFormData } from '@/lib/validations';
import { Trip, Contractor, Driver, Vehicle, TripStatus, Route, CargoType } from '@/types';
import { ExpenseType } from '@/types/expenses';
import { supabaseService } from '@/services/supabaseService';
import { getCurrentCompanyId } from '@/lib/companyContext';
import { useToast } from '@/hooks/use-toast';
import { TripFormBasicInfoEnhanced } from './TripFormBasicInfoEnhanced';
import { TripFormDriverEnhanced } from './TripFormDriverEnhanced';
import { TripFormVehicleEnhanced } from './TripFormVehicleEnhanced';
import { TripFormCargoEnhanced } from './TripFormCargoEnhanced';
import { TripFormExpenses } from './TripFormExpenses';
import { RequiredLabel } from '@/components/ui/required-label';
import { Calendar, User, Truck, Package, Receipt, MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TripFormTabsProps {
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

const tabItems = [
  { value: 'basic', label: 'Основное', icon: Calendar },
  { value: 'driver', label: 'Водитель', icon: User },
  { value: 'vehicle', label: 'Транспорт', icon: Truck },
  { value: 'cargo', label: 'Груз', icon: Package },
  { value: 'expenses', label: 'Расходы', icon: Receipt },
  { value: 'comments', label: 'Комментарии', icon: MessageSquare }
];

export const TripFormTabs: React.FC<TripFormTabsProps> = ({
  trip,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [expenses, setExpenses] = useState<ExpenseFormData[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCargoTypeId, setSelectedCargoTypeId] = useState<string | null>(null);
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
    defaultValues: getDefaultValues(),
    mode: 'onChange' // Enable real-time validation
  });

  const formErrors = form.formState.errors;
  
  // Check if a tab has errors
  const getTabErrors = (tab: string): boolean => {
    switch (tab) {
      case 'basic':
        return !!(formErrors.status || formErrors.contractorId || formErrors.pointA || formErrors.pointB || formErrors.departureDate);
      case 'driver':
        return !!(formErrors.driver?.name || formErrors.driver?.phone);
      case 'vehicle':
        return !!(formErrors.vehicle?.brand || formErrors.vehicle?.model || formErrors.vehicle?.licensePlate);
      case 'cargo':
        return !!(formErrors.cargo?.description || formErrors.cargo?.weight || formErrors.cargo?.volume);
      default:
        return false;
    }
  };

  useEffect(() => {
    if (open) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
      setActiveTab('basic');
      setSelectedDriverId(null);
      setSelectedVehicleId(null);
      setSelectedRouteId(null);
      setSelectedCargoTypeId(null);
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
      setSelectedRouteId(routeId);
    }
  };

  const handleDriverChange = (driverId: string) => {
    const selectedDriver = drivers.find(d => d.id === driverId);
    if (selectedDriver) {
      form.setValue('driver.name', selectedDriver.name);
      form.setValue('driver.phone', selectedDriver.phone);
      form.setValue('driver.license', selectedDriver.license || '');
      setSelectedDriverId(driverId);
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      form.setValue('vehicle.brand', selectedVehicle.brand);
      form.setValue('vehicle.model', selectedVehicle.model);
      form.setValue('vehicle.licensePlate', selectedVehicle.licensePlate);
      form.setValue('vehicle.capacity', selectedVehicle.capacity);
      setSelectedVehicleId(vehicleId);
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
      setSelectedCargoTypeId(cargoTypeId);
    }
  };

  const onSubmit = async (data: TripFormData) => {
    setLoading(true);
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const tripData = {
        status: data.status,
        departure_date: data.departureDate.toISOString(),
        arrival_date: data.arrivalDate ? data.arrivalDate.toISOString() : null,
        point_a: data.pointA,
        point_b: data.pointB,
        contractor_id: data.contractorId,
        driver_id: selectedDriverId || null,
        vehicle_id: selectedVehicleId || null,
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

      let result;
      if (trip?.id) {
        result = await supabaseService.supabase
          .from('trips')
          .update(tripData)
          .eq('id', trip.id)
          .select();
      } else {
        const companyId = await getCurrentCompanyId();
        result = await supabaseService.supabase
          .from('trips')
          .insert({ ...tripData, company_id: companyId })
          .select();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      const savedTrip = result.data[0];

      // Save expenses
      if (expenses.length > 0) {
        if (trip?.id) {
          await supabaseService.supabase
            .from('trip_expenses')
            .delete()
            .eq('trip_id', trip.id);
        }

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
          }
        }
      }

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
        description: 'Не удалось сохранить рейс. Проверьте заполнение обязательных полей.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const goToNextTab = () => {
    const currentIndex = tabItems.findIndex(t => t.value === activeTab);
    if (currentIndex < tabItems.length - 1) {
      setActiveTab(tabItems[currentIndex + 1].value);
    }
  };

  const goToPrevTab = () => {
    const currentIndex = tabItems.findIndex(t => t.value === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabItems[currentIndex - 1].value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {trip ? 'Редактировать рейс' : 'Создать рейс'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-6 mb-4">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  const hasError = getTabErrors(tab.value);
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value}
                      className="flex items-center gap-1 text-xs sm:text-sm relative"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {hasError && (
                        <AlertCircle className="h-3 w-3 text-destructive absolute -top-1 -right-1" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="flex-1 overflow-y-auto px-1">
                <TabsContent value="basic" className="mt-0">
                  <TripFormBasicInfoEnhanced
                    control={form.control}
                    contractors={contractors}
                    routes={routes}
                    onRouteChange={handleRouteChange}
                    selectedRouteId={selectedRouteId}
                  />
                </TabsContent>

                <TabsContent value="driver" className="mt-0">
                  <TripFormDriverEnhanced
                    control={form.control}
                    setValue={form.setValue}
                    drivers={drivers}
                    onDriverChange={handleDriverChange}
                    selectedDriverId={selectedDriverId}
                  />
                </TabsContent>

                <TabsContent value="vehicle" className="mt-0">
                  <TripFormVehicleEnhanced
                    control={form.control}
                    setValue={form.setValue}
                    vehicles={vehicles}
                    onVehicleChange={handleVehicleChange}
                    selectedVehicleId={selectedVehicleId}
                  />
                </TabsContent>

                <TabsContent value="cargo" className="mt-0">
                  <TripFormCargoEnhanced
                    control={form.control}
                    setValue={form.setValue}
                    cargoTypes={cargoTypes}
                    onCargoTypeChange={handleCargoTypeChange}
                    selectedCargoTypeId={selectedCargoTypeId}
                  />
                </TabsContent>

                <TabsContent value="expenses" className="mt-0">
                  <TripFormExpenses
                    expenses={expenses}
                    onExpensesChange={setExpenses}
                  />
                </TabsContent>

                <TabsContent value="comments" className="mt-0">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <RequiredLabel>Комментарии</RequiredLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Дополнительные комментарии к рейсу..." 
                              {...field} 
                              rows={8}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPrevTab}
                  disabled={activeTab === 'basic'}
                >
                  Назад
                </Button>
                {activeTab !== 'comments' && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goToNextTab}
                  >
                    Далее
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Сохранение...' : trip ? 'Обновить' : 'Создать'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
