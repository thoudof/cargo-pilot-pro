import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Truck, User, Calendar } from 'lucide-react';
import { Trip, TripStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';

interface SimpleDriver {
  id: string;
  name: string;
  phone: string;
  license: string;
}

interface SimpleVehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  capacity: number;
}

interface TripBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTrips: Trip[];
  onSuccess: () => void;
}

interface BulkEditFields {
  status?: TripStatus;
  driverId?: string;
  vehicleId?: string;
  departureDate?: Date;
}

export const TripBulkEditDialog: React.FC<TripBulkEditDialogProps> = ({
  open,
  onOpenChange,
  selectedTrips,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<SimpleDriver[]>([]);
  const [vehicles, setVehicles] = useState<SimpleVehicle[]>([]);
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Record<string, boolean>>({
    status: false,
    driverId: false,
    vehicleId: false,
    departureDate: false
  });
  const [values, setValues] = useState<BulkEditFields>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
      // Reset form when dialog opens
      setFieldsToUpdate({
        status: false,
        driverId: false,
        vehicleId: false,
        departureDate: false
      });
      setValues({});
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [driversResult, vehiclesResult] = await Promise.all([
        supabase.from('drivers').select('*').order('name'),
        supabase.from('vehicles').select('*').order('brand')
      ]);

      if (driversResult.data) {
        setDrivers(driversResult.data.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone || '',
          license: d.license || '',
          passportData: d.passport_data || '',
          experienceYears: d.experience_years || 0,
          notes: d.notes || ''
        })));
      }

      if (vehiclesResult.data) {
        setVehicles(vehiclesResult.data.map(v => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          licensePlate: v.license_plate,
          year: v.year || 0,
          capacity: v.capacity || 0,
          vin: v.vin || '',
          registrationCertificate: v.registration_certificate || '',
          insurancePolicy: v.insurance_policy || '',
          insuranceExpiry: v.insurance_expiry || '',
          technicalInspectionExpiry: v.technical_inspection_expiry || '',
          notes: v.notes || ''
        })));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleFieldToggle = (field: string, checked: boolean) => {
    setFieldsToUpdate(prev => ({ ...prev, [field]: checked }));
    if (!checked) {
      setValues(prev => {
        const newValues = { ...prev };
        delete newValues[field as keyof BulkEditFields];
        return newValues;
      });
    }
  };

  const handleBulkUpdate = async () => {
    const activeFields = Object.entries(fieldsToUpdate).filter(([, active]) => active);
    
    if (activeFields.length === 0) {
      toast({
        title: 'Выберите поля для обновления',
        description: 'Отметьте хотя бы одно поле для массового редактирования',
        variant: 'destructive'
      });
      return;
    }

    // Validate that all selected fields have values
    for (const [field] of activeFields) {
      if (values[field as keyof BulkEditFields] === undefined) {
        toast({
          title: 'Заполните все выбранные поля',
          description: `Поле "${getFieldLabel(field)}" не заполнено`,
          variant: 'destructive'
        });
        return;
      }
    }

    setLoading(true);
    try {
      const updates: Record<string, any> = {};
      
      if (fieldsToUpdate.status && values.status) {
        updates.status = values.status;
      }
      
      if (fieldsToUpdate.driverId && values.driverId) {
        const driver = drivers.find(d => d.id === values.driverId);
        if (driver) {
          updates.driver_id = driver.id;
          updates.driver_name = driver.name;
          updates.driver_phone = driver.phone;
          updates.driver_license = driver.license;
        }
      }
      
      if (fieldsToUpdate.vehicleId && values.vehicleId) {
        const vehicle = vehicles.find(v => v.id === values.vehicleId);
        if (vehicle) {
          updates.vehicle_id = vehicle.id;
          updates.vehicle_brand = vehicle.brand;
          updates.vehicle_model = vehicle.model;
          updates.vehicle_license_plate = vehicle.licensePlate;
          updates.vehicle_capacity = vehicle.capacity;
        }
      }
      
      if (fieldsToUpdate.departureDate && values.departureDate) {
        updates.departure_date = values.departureDate.toISOString();
      }

      updates.updated_at = new Date().toISOString();

      // Update all selected trips
      const tripIds = selectedTrips.map(t => t.id);
      const { error } = await supabase
        .from('trips')
        .update(updates)
        .in('id', tripIds);

      if (error) throw error;

      toast({
        title: 'Рейсы обновлены',
        description: `Успешно обновлено ${selectedTrips.length} рейс(ов)`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to bulk update trips:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить рейсы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      status: 'Статус',
      driverId: 'Водитель',
      vehicleId: 'Транспорт',
      departureDate: 'Дата отправления'
    };
    return labels[field] || field;
  };

  const activeFieldsCount = Object.values(fieldsToUpdate).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Массовое редактирование
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="secondary">{selectedTrips.length} рейс(ов) выбрано</Badge>
            {activeFieldsCount > 0 && (
              <Badge variant="outline">{activeFieldsCount} полей для обновления</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">
              Отметьте поля, которые хотите изменить. Выбранные значения будут применены ко всем выбранным рейсам.
            </span>
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-status"
                checked={fieldsToUpdate.status}
                onCheckedChange={(checked) => handleFieldToggle('status', !!checked)}
              />
              <Label htmlFor="field-status" className="flex items-center gap-2 cursor-pointer">
                Статус
              </Label>
            </div>
            {fieldsToUpdate.status && (
              <Select
                value={values.status}
                onValueChange={(value) => setValues(prev => ({ ...prev, status: value as TripStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TripStatus.PLANNED}>Планируется</SelectItem>
                  <SelectItem value={TripStatus.IN_PROGRESS}>В пути</SelectItem>
                  <SelectItem value={TripStatus.COMPLETED}>Завершён</SelectItem>
                  <SelectItem value={TripStatus.CANCELLED}>Отменён</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Driver Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-driver"
                checked={fieldsToUpdate.driverId}
                onCheckedChange={(checked) => handleFieldToggle('driverId', !!checked)}
              />
              <Label htmlFor="field-driver" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Водитель
              </Label>
            </div>
            {fieldsToUpdate.driverId && (
              <Select
                value={values.driverId}
                onValueChange={(value) => setValues(prev => ({ ...prev, driverId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите водителя" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} • {driver.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Vehicle Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-vehicle"
                checked={fieldsToUpdate.vehicleId}
                onCheckedChange={(checked) => handleFieldToggle('vehicleId', !!checked)}
              />
              <Label htmlFor="field-vehicle" className="flex items-center gap-2 cursor-pointer">
                <Truck className="h-4 w-4" />
                Транспорт
              </Label>
            </div>
            {fieldsToUpdate.vehicleId && (
              <Select
                value={values.vehicleId}
                onValueChange={(value) => setValues(prev => ({ ...prev, vehicleId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите транспорт" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} • {vehicle.licensePlate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Departure Date Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-date"
                checked={fieldsToUpdate.departureDate}
                onCheckedChange={(checked) => handleFieldToggle('departureDate', !!checked)}
              />
              <Label htmlFor="field-date" className="flex items-center gap-2 cursor-pointer">
                <Calendar className="h-4 w-4" />
                Дата отправления
              </Label>
            </div>
            {fieldsToUpdate.departureDate && (
              <DatePicker
                date={values.departureDate}
                onSelect={(date) => setValues(prev => ({ ...prev, departureDate: date }))}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleBulkUpdate} disabled={loading || activeFieldsCount === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Обновить {selectedTrips.length} рейс(ов)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
