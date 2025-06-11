
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Route, Edit2, Trash2, MapPin } from 'lucide-react';
import { Route as RouteType } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

export const RouteList: React.FC = () => {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const data = await supabaseService.getRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Failed to load routes:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить маршруты',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (route: RouteType) => {
    try {
      await supabaseService.deleteRoute(route.id);
      await loadRoutes();
      toast({
        title: 'Маршрут удален',
        description: `${route.name} успешно удален`
      });
    } catch (error) {
      console.error('Failed to delete route:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить маршрут',
        variant: 'destructive'
      });
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.pointA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.pointB.toLowerCase().includes(searchTerm.toLowerCase())
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
                      {route.distanceKm && <p>Расстояние: {route.distanceKm} км</p>}
                      {route.estimatedDurationHours && <p>Время в пути: {route.estimatedDurationHours} ч</p>}
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
                      onClick={() => handleDeleteRoute(route)}
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
