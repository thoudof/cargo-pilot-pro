
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Truck, Edit2, Trash2 } from 'lucide-react';
import { Vehicle } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

export const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await supabaseService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить транспорт',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    try {
      await supabaseService.deleteVehicle(vehicle.id);
      await loadVehicles();
      toast({
        title: 'Транспорт удален',
        description: `${vehicle.brand} ${vehicle.model} успешно удален`
      });
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить транспорт',
        variant: 'destructive'
      });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск транспорта..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12"
          />
        </div>
        <Button className="h-12 px-6">
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {filteredVehicles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет транспорта</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Не найдено транспорта по заданным критериям' : 'Добавьте первое транспортное средство для начала работы'}
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Добавить транспорт
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{vehicle.brand} {vehicle.model}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Гос. номер: {vehicle.licensePlate}</p>
                      {vehicle.capacity && <p>Грузоподъемность: {vehicle.capacity} т</p>}
                      {vehicle.year && <p>Год выпуска: {vehicle.year}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Свободен</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVehicle(vehicle)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {vehicle.notes && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
