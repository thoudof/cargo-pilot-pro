
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, Edit2, Trash2, AlertTriangle, Thermometer, Shield } from 'lucide-react';

export const CargoTypeList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Пример данных - позже заменить на реальные данные из базы
  const cargoTypes = [
    {
      id: '1',
      name: 'Продукты питания',
      description: 'Скоропортящиеся продукты',
      defaultWeight: 1000,
      defaultVolume: 15,
      hazardous: false,
      temperatureControlled: true,
      fragile: false
    },
    {
      id: '2',
      name: 'Строительные материалы',
      description: 'Кирпич, цемент, арматура',
      defaultWeight: 5000,
      defaultVolume: 20,
      hazardous: false,
      temperatureControlled: false,
      fragile: false
    },
    {
      id: '3',
      name: 'Хрупкие товары',
      description: 'Стекло, керамика, электроника',
      defaultWeight: 500,
      defaultVolume: 10,
      hazardous: false,
      temperatureControlled: false,
      fragile: true
    }
  ];

  const filteredCargoTypes = cargoTypes.filter(cargoType =>
    cargoType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cargoType.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      <p>{cargoType.description}</p>
                      <p>Вес по умолчанию: {cargoType.defaultWeight} кг</p>
                      <p>Объем по умолчанию: {cargoType.defaultVolume} м³</p>
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
