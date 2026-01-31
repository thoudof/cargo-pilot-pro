import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Edit2, Trash2, Phone, MessageCircle } from 'lucide-react';
import { Driver } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DriverForm } from './DriverForm';
import { TelegramLinkDialog } from './TelegramLinkDialog';
import { useAuth } from '@/components/Auth/AuthProvider';

interface DriverWithTelegram extends Driver {
  telegramChatId?: string | null;
}

export const DriverList: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverWithTelegram[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>();
  const [telegramDialogDriver, setTelegramDialogDriver] = useState<DriverWithTelegram | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      // Load drivers with telegram_chat_id
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const transformedDrivers: DriverWithTelegram[] = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone || '',
        license: d.license,
        passportData: d.passport_data,
        experienceYears: d.experience_years,
        notes: d.notes,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
        telegramChatId: d.telegram_chat_id,
      }));
      
      setDrivers(transformedDrivers);
    } catch (error) {
      console.error('Failed to load drivers:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить водителей',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = async (driver: Driver) => {
    try {
      await supabaseService.deleteDriver(driver.id);
      await loadDrivers();
      toast({
        title: 'Водитель удален',
        description: `${driver.name} успешно удален`
      });
    } catch (error) {
      console.error('Failed to delete driver:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить водителя',
        variant: 'destructive'
      });
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingDriver(undefined);
    loadDrivers();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDriver(undefined);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingDriver(undefined);
    setShowForm(true);
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm) ||
    (driver.license && driver.license.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (showForm) {
    return (
      <DriverForm 
        driver={editingDriver}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

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
            placeholder="Поиск водителей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12"
          />
        </div>
        <Button className="h-12 px-6" onClick={handleAdd}>
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
              <Button onClick={handleAdd}>
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
                      {driver.license && <p>Категория: {driver.license}</p>}
                      {driver.experienceYears && <p>Опыт: {driver.experienceYears} лет</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {driver.telegramChatId ? (
                      <Badge variant="secondary" className="gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Telegram
                      </Badge>
                    ) : (
                      <Badge variant="outline">Свободен</Badge>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTelegramDialogDriver(driver)}
                        title="Настройки Telegram"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(driver)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDriver(driver)}
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

      {/* Telegram Link Dialog */}
      {telegramDialogDriver && (
        <TelegramLinkDialog
          open={!!telegramDialogDriver}
          onOpenChange={(open) => {
            if (!open) {
              setTelegramDialogDriver(null);
              loadDrivers(); // Refresh to show updated telegram status
            }
          }}
          driverId={telegramDialogDriver.id}
          driverName={telegramDialogDriver.name}
        />
      )}
    </div>
  );
};