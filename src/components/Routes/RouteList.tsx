
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Route, Edit2, Trash2, MapPin } from 'lucide-react';

export const RouteList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Пример данных - позже заменить на реальные данные из базы
  const routes = [
    {
      id: '1',
      name: 'Москва - СПб (федеральная)',
      pointA: 'Москва',
      pointB: 'Санкт-Петербург',
      distanceKm: 635,
      estimatedDurationHours: 8.5,
      notes: 'Основной маршрут через М11'
    },
    {
      id: '2',
      name: 'Казань - Екатеринбург',
      pointA: 'Казань',
      pointB: 'Екатеринбург',
      distanceKm: 750,
      estimatedDurationHours: 12,
      notes: 'Через Пермь'
    }
  ];

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.pointA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.pointB.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск маршрутов..."
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

      {filteredRoutes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Route className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет маршрутов</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Не найдено маршрутов по заданным критериям' : 'Добавьте первый маршрут для начала работы'}
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Добавить маршрут
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{route.name}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{route.pointA} → {route.pointB}</span>
                      </div>
                      <p>Расстояние: {route.distanceKm} км</p>
                      <p>Время в пути: {route.estimatedDurationHours} ч</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
              {route.notes && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{route.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
