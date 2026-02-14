import React, { useState } from 'react';
import { Save, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/lib/companyContext';
import { toast } from 'sonner';
import { Trip } from '@/types';

interface SaveAsTemplateDialogProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SaveAsTemplateDialog: React.FC<SaveAsTemplateDialogProps> = ({
  trip,
  open,
  onOpenChange,
}) => {
  const [name, setName] = useState(`${trip.pointA?.split(',')[0]} → ${trip.pointB?.split(',')[0]}`);
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const queryClient = useQueryClient();

  const saveTemplate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCurrentCompanyId();
      const templateData = {
        name,
        description: description || null,
        route_id: trip.routeId || null,
        contractor_id: trip.contractorId || null,
        driver_id: trip.driverId || null,
        vehicle_id: trip.vehicleId || null,
        cargo_type_id: trip.cargoTypeId || null,
        point_a: trip.pointA,
        point_b: trip.pointB,
        cargo_description: trip.cargo?.description,
        cargo_weight: trip.cargo?.weight,
        cargo_volume: trip.cargo?.volume,
        cargo_value: trip.cargo?.value,
        is_favorite: isFavorite,
        created_by: user.id,
        company_id: companyId,
      };

      const { error } = await supabase
        .from('trip_templates')
        .insert(templateData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Шаблон сохранен');
      queryClient.invalidateQueries({ queryKey: ['trip-templates'] });
      onOpenChange(false);
      setName('');
      setDescription('');
      setIsFavorite(false);
    },
    onError: (error) => {
      console.error('Failed to save template:', error);
      toast.error('Не удалось сохранить шаблон');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Сохранить как шаблон
          </DialogTitle>
          <DialogDescription>
            Сохраните этот рейс как шаблон для быстрого создания похожих рейсов
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Название шаблона</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Москва - СПб (ежедневный)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Описание (опционально)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация о шаблоне..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="favorite" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Добавить в избранное
              </Label>
              <p className="text-xs text-muted-foreground">
                Избранные шаблоны отображаются первыми
              </p>
            </div>
            <Switch
              id="favorite"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={() => saveTemplate.mutate()} 
            disabled={!name.trim() || saveTemplate.isPending}
          >
            {saveTemplate.isPending ? 'Сохранение...' : 'Сохранить шаблон'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};