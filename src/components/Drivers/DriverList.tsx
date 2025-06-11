
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Edit2, Trash2, Phone } from 'lucide-react';

export const DriverList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Пример данных - позже заменить на реальные данные из базы
  const drivers = [
    {
      id: '1',
      name: 'Иванов Иван Иванович',
      phone: '+7 (999) 123-45-67',
      license: 'CE',
      experienceYears: 5,
      notes: 'Опытный водитель'
    },
    {
      id: '2',
      name: 'Петров Петр Петрович',
      phone: '+7 (999) 234-56-78',
      license: 'D',
      experienceYears: 8,
      notes: 'Специализируется на дальних рейсах'
    }
  ];

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm) ||
    driver.license.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск водителей..."
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

      {filteredDrivers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет водителей</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Не найдено водителей по заданным критериям' : 'Добавьте первого водителя для начала работы'}
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Добавить водителя
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{driver.name}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{driver.phone}</span>
                      </div>
                      <p>Категория: {driver.license}</p>
                      <p>Опыт: {driver.experienceYears} лет</p>
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
              {driver.notes && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{driver.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
