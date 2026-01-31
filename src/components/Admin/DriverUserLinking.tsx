import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Unlink, UserCircle, Truck, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RequiredLabel } from '@/components/ui/required-label';

interface DriverUser {
  id: string;
  user_id: string;
  driver_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  driver?: {
    name: string;
    phone: string | null;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface Driver {
  id: string;
  name: string;
  phone: string | null;
}

export const DriverUserLinking: React.FC = () => {
  const [links, setLinks] = useState<DriverUser[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch existing links
      const { data: linksData, error: linksError } = await supabase
        .from('driver_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('id, name, phone')
        .order('name');

      if (driversError) throw driversError;

      // Enrich links with profile and driver info
      const enrichedLinks = (linksData || []).map(link => {
        const profile = profilesData?.find(p => p.id === link.user_id);
        const driver = driversData?.find(d => d.id === link.driver_id);
        return {
          ...link,
          profile: profile ? { full_name: profile.full_name, phone: profile.phone } : undefined,
          driver: driver ? { name: driver.name, phone: driver.phone } : undefined,
        };
      });

      setLinks(enrichedLinks);
      setProfiles(profilesData || []);
      setDrivers(driversData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    if (!selectedUserId || !selectedDriverId) {
      toast({
        title: "Ошибка",
        description: "Выберите пользователя и водителя",
        variant: "destructive"
      });
      return;
    }

    // Check if user already linked
    const existingUserLink = links.find(l => l.user_id === selectedUserId);
    if (existingUserLink) {
      toast({
        title: "Ошибка",
        description: "Этот пользователь уже привязан к водителю",
        variant: "destructive"
      });
      return;
    }

    // Check if driver already linked
    const existingDriverLink = links.find(l => l.driver_id === selectedDriverId);
    if (existingDriverLink) {
      toast({
        title: "Ошибка",
        description: "Этот водитель уже привязан к пользователю",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('driver_users')
        .insert({
          user_id: selectedUserId,
          driver_id: selectedDriverId
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Пользователь привязан к водителю"
      });

      setDialogOpen(false);
      setSelectedUserId('');
      setSelectedDriverId('');
      fetchData();
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать привязку",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту привязку?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('driver_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Привязка удалена"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить привязку",
        variant: "destructive"
      });
    }
  };

  // Filter out already linked users and drivers
  const availableUsers = profiles.filter(p => !links.some(l => l.user_id === p.id));
  const availableDrivers = drivers.filter(d => !links.some(l => l.driver_id === d.id));

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            Привязка пользователей к водителям
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Создать привязку</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Привязать пользователя к водителю</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <RequiredLabel required>Пользователь</RequiredLabel>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите пользователя" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Нет доступных пользователей
                        </div>
                      ) : (
                        availableUsers.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <span>{profile.full_name || 'Без имени'}</span>
                              {profile.phone && (
                                <span className="text-muted-foreground text-xs">({profile.phone})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <RequiredLabel required>Водитель</RequiredLabel>
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите водителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Нет доступных водителей
                        </div>
                      ) : (
                        availableDrivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <span>{driver.name}</span>
                              {driver.phone && (
                                <span className="text-muted-foreground text-xs">({driver.phone})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Отмена</Button>
                </DialogClose>
                <Button onClick={createLink} disabled={saving || !selectedUserId || !selectedDriverId}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Привязать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="font-semibold">Пользователь</TableHead>
                <TableHead className="font-semibold">Водитель</TableHead>
                <TableHead className="font-semibold">Дата привязки</TableHead>
                <TableHead className="text-right font-semibold">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{link.profile?.full_name || 'Не указано'}</p>
                        {link.profile?.phone && (
                          <p className="text-xs text-muted-foreground">{link.profile.phone}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-success/10">
                        <Truck className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{link.driver?.name || 'Не найден'}</p>
                        {link.driver?.phone && (
                          <p className="text-xs text-muted-foreground">{link.driver.phone}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-muted-foreground">
                      {new Date(link.created_at).toLocaleDateString('ru-RU')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteLink(link.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {links.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Нет привязанных пользователей</p>
            <p className="text-sm mt-1">Создайте первую привязку, чтобы водитель мог войти в систему</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
