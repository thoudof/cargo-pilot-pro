
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Truck, Edit2, Trash2 } from 'lucide-react';

export const VehicleList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Пример данных - позже заменить на реальные данные из базы
  const vehicles = [
    {
      id: '1',
      brand: 'МАЗ',
      model: '6312',
      licensePlate: 'А123БВ777',
      capacity: 20,
      year: 2020,
      notes: 'Рефрижератор'
    },
    {
      id: '2',
      brand: 'КАМАЗ',
      model: '65116',
      licensePlate: 'В456ГД777',
      capacity: 15,
      year: 2019,
      notes: 'Бортовой'
    }
  ];

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      <p>Грузоподъемность: {vehicle.capacity} т</p>
                      <p>Год выпуска: {vehicle.year}</p>
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
