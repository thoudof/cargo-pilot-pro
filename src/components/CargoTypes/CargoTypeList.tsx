
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, Edit2, Trash2, AlertTriangle, Thermometer, Shield } from 'lucide-react';
import { CargoType } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

export const CargoTypeList: React.FC = () => {
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCargoTypes();
  }, []);

  const loadCargoTypes = async () => {
    try {
      const data = await supabaseService.getCargoTypes();
      setCargoTypes(data);
    } catch (error) {
      console.error('Failed to load cargo types:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить типы грузов',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCargoType = async (cargoType: CargoType) => {
    try {
      await supabaseService.deleteCargoType(cargoType.id);
      await loadCargoTypes();
      toast({
        title: 'Тип груза удален',
        description: `${cargoType.name} успешно удален`
      });
    } catch (error) {
      console.error('Failed to delete cargo type:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тип груза',
        variant: 'destructive'
      });
    }
  };

  const filteredCargoTypes = cargoTypes.filter(cargoType =>
    cargoType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cargoType.description && cargoType.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
            placeholder="Поиск типов грузов..."
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

      {filteredCargoTypes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет типов грузов</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Не найдено типов грузов по заданным критериям' : 'Добавьте первый тип груза для начала работы'}
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Добавить тип груза
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCargoTypes.map((cargoType) => (
            <Card key={cargoType.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{cargoType.name}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {cargoType.description && <p>{cargoType.description}</p>}
                      {cargoType.defaultWeight && <p>Вес по умолчанию: {cargoType.defaultWeight} кг</p>}
                      {cargoType.defaultVolume && <p>Объем по умолчанию: {cargoType.defaultVolume} м³</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      {cargoType.hazardous && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Опасный
                        </Badge>
                      )}
                      {cargoType.temperatureControlled && (
                        <Badge variant="secondary" className="text-xs">
                          <Thermometer className="h-3 w-3 mr-1" />
                          Температурный режим
                        </Badge>
                      )}
                      {cargoType.fragile && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Хрупкий
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCargoType(cargoType)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
