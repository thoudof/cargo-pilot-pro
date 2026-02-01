import React, { useState } from 'react';
import { Plus, Zap, Star, Clock, ArrowRight, Truck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TripForm } from './TripForm';
import { Trip, TripStatus } from '@/types';

interface TripTemplate {
  id: string;
  name: string;
  description?: string;
  route_id?: string;
  contractor_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  cargo_type_id?: string;
  point_a?: string;
  point_b?: string;
  cargo_description?: string;
  cargo_weight?: number;
  cargo_volume?: number;
  cargo_value?: number;
  default_expenses?: any[];
  is_favorite: boolean;
  usage_count: number;
  routes?: { name: string; point_a: string; point_b: string };
  contractors?: { company_name: string };
  drivers?: { name: string; phone?: string; license?: string };
  vehicles?: { brand: string; model: string; license_plate: string };
}

interface QuickTripCreatorProps {
  onTripCreated?: () => void;
}

export const QuickTripCreator: React.FC<QuickTripCreatorProps> = ({ onTripCreated }) => {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [tripToSave, setTripToSave] = useState<Trip | null>(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['trip-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_templates')
        .select(`
          *,
          routes(name, point_a, point_b),
          contractors(company_name),
          drivers(name, phone, license),
          vehicles(brand, model, license_plate)
        `)
        .order('is_favorite', { ascending: false })
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data as TripTemplate[];
    },
  });

  const createFromTemplate = useMutation({
    mutationFn: async (template: TripTemplate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Increment usage count
      await supabase
        .from('trip_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', template.id);

      // Create trip from template
      const tripData = {
        status: 'planned',
        departure_date: new Date().toISOString(),
        point_a: template.point_a || template.routes?.point_a || '',
        point_b: template.point_b || template.routes?.point_b || '',
        contractor_id: template.contractor_id,
        driver_id: template.driver_id,
        vehicle_id: template.vehicle_id,
        cargo_type_id: template.cargo_type_id,
        cargo_description: template.cargo_description,
        cargo_weight: template.cargo_weight,
        cargo_volume: template.cargo_volume,
        cargo_value: template.cargo_value,
        driver_name: template.drivers?.name,
        driver_phone: template.drivers?.phone,
        driver_license: template.drivers?.license,
        vehicle_brand: template.vehicles?.brand,
        vehicle_model: template.vehicles?.model,
        vehicle_license_plate: template.vehicles?.license_plate,
      };

      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) throw error;

      // Create default expenses if any
      if (template.default_expenses && template.default_expenses.length > 0) {
        const expenses = template.default_expenses.map((exp: any) => ({
          trip_id: data.id,
          category: exp.category,
          amount: exp.amount,
          description: exp.description,
          date: new Date().toISOString(),
          created_by: user.id,
        }));

        await supabase.from('trip_expenses').insert(expenses);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Рейс создан из шаблона');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip-templates'] });
      setOpen(false);
      onTripCreated?.();
    },
    onError: (error) => {
      console.error('Failed to create trip:', error);
      toast.error('Не удалось создать рейс');
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (template: TripTemplate) => {
      const { error } = await supabase
        .from('trip_templates')
        .update({ is_favorite: !template.is_favorite })
        .eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('trip_templates')
        .delete()
        .eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Шаблон удален');
      queryClient.invalidateQueries({ queryKey: ['trip-templates'] });
    },
  });

  const handleQuickCreate = (template: TripTemplate) => {
    createFromTemplate.mutate(template);
  };

  const handleCustomCreate = () => {
    setSelectedTemplate(null);
    setShowTripForm(true);
    setOpen(false);
  };

  const handleTripFormSuccess = () => {
    setShowTripForm(false);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    onTripCreated?.();
  };

  const favoriteTemplates = templates.filter(t => t.is_favorite);
  const recentTemplates = templates.filter(t => !t.is_favorite).slice(0, 5);

  const getPrefilledTrip = (): Trip | undefined => {
    if (!selectedTemplate) return undefined;
    
    return {
      id: '',
      status: TripStatus.PLANNED,
      departureDate: new Date(),
      pointA: selectedTemplate.point_a || selectedTemplate.routes?.point_a || '',
      pointB: selectedTemplate.point_b || selectedTemplate.routes?.point_b || '',
      contractorId: selectedTemplate.contractor_id,
      driverId: selectedTemplate.driver_id,
      vehicleId: selectedTemplate.vehicle_id,
      driver: selectedTemplate.drivers ? {
        name: selectedTemplate.drivers.name,
        phone: selectedTemplate.drivers.phone || '',
        license: selectedTemplate.drivers.license || '',
      } : undefined,
      vehicle: selectedTemplate.vehicles ? {
        brand: selectedTemplate.vehicles.brand,
        model: selectedTemplate.vehicles.model,
        licensePlate: selectedTemplate.vehicles.license_plate,
      } : undefined,
      cargo: {
        description: selectedTemplate.cargo_description || '',
        weight: selectedTemplate.cargo_weight || 0,
        volume: selectedTemplate.cargo_volume || 0,
        value: selectedTemplate.cargo_value,
      },
    } as Trip;
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Zap className="h-4 w-4" />
        Быстрый рейс
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Быстрое создание рейса
            </DialogTitle>
            <DialogDescription>
              Выберите шаблон для создания рейса в 2 клика или создайте новый
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">Шаблоны</TabsTrigger>
              <TabsTrigger value="new">Новый рейс</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Нет сохраненных шаблонов
                  </p>
                  <Button variant="outline" onClick={handleCustomCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первый рейс
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {favoriteTemplates.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Star className="h-3 w-3" /> Избранные
                        </h4>
                        <div className="grid gap-2">
                          {favoriteTemplates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              onQuickCreate={handleQuickCreate}
                              onToggleFavorite={() => toggleFavorite.mutate(template)}
                              onDelete={() => deleteTemplate.mutate(template.id)}
                              isCreating={createFromTemplate.isPending}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {recentTemplates.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Часто используемые
                        </h4>
                        <div className="grid gap-2">
                          {recentTemplates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              onQuickCreate={handleQuickCreate}
                              onToggleFavorite={() => toggleFavorite.mutate(template)}
                              onDelete={() => deleteTemplate.mutate(template.id)}
                              isCreating={createFromTemplate.isPending}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="new" className="mt-4">
              <div className="grid gap-4">
                <Card 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleCustomCreate}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Создать новый рейс</h4>
                      <p className="text-sm text-muted-foreground">
                        Откроется полная форма создания рейса
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      💡 Совет: После создания рейса вы можете сохранить его как шаблон 
                      для быстрого создания похожих рейсов в будущем
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <TripForm
        trip={getPrefilledTrip()}
        open={showTripForm}
        onOpenChange={setShowTripForm}
        onSuccess={handleTripFormSuccess}
      />
    </>
  );
};

interface TemplateCardProps {
  template: TripTemplate;
  onQuickCreate: (template: TripTemplate) => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  isCreating: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onQuickCreate,
  onToggleFavorite,
  onDelete,
  isCreating,
}) => {
  const pointA = template.point_a || template.routes?.point_a || '—';
  const pointB = template.point_b || template.routes?.point_b || '—';

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{template.name}</h4>
              {template.usage_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {template.usage_count}x
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="truncate max-w-[100px]">{pointA.split(',')[0]}</span>
              <ArrowRight className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">{pointB.split(',')[0]}</span>
            </div>

            {template.contractors && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {template.contractors.company_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Star 
                className={cn(
                  "h-4 w-4",
                  template.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )} 
              />
            </Button>
            
            <Button
              size="sm"
              onClick={() => onQuickCreate(template)}
              disabled={isCreating}
            >
              {isCreating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Создать
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};