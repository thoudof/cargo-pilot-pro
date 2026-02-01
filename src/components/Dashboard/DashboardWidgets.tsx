import React, { useState, useCallback } from 'react';
import { 
  Truck, Users, Car, Building2, TrendingUp, TrendingDown, DollarSign, 
  Package, Route, Calendar, BarChart3, GripVertical, Settings, Eye, EyeOff,
  X, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatWeight } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WidgetConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: 'trips' | 'finance' | 'resources' | 'analytics';
  defaultVisible: boolean;
  render: (stats: any) => React.ReactNode;
}

interface DashboardWidgetsProps {
  stats: {
    activeTrips: number;
    totalTrips: number;
    completedTrips: number;
    plannedTrips: number;
    cancelledTrips: number;
    contractors: number;
    drivers: number;
    vehicles: number;
    totalCargoValue: number;
    completedCargoValue: number;
    totalWeight: number;
    totalVolume: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
    averageCargoValue: number;
    completionRate: number;
  };
}

const widgetConfigs: WidgetConfig[] = [
  {
    id: 'active-trips',
    title: 'Активные рейсы',
    icon: <Truck className="h-5 w-5" />,
    category: 'trips',
    defaultVisible: true,
    render: (stats) => (
      <StatWidget
        value={stats.activeTrips}
        subtitle={`из ${stats.totalTrips} всего`}
        iconBgClass="bg-primary/10 text-primary"
        icon={<Truck className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'completed-trips',
    title: 'Завершённые',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'trips',
    defaultVisible: true,
    render: (stats) => (
      <StatWidget
        value={stats.completedTrips}
        subtitle={`${stats.completionRate?.toFixed(1) || 0}% выполнения`}
        iconBgClass="bg-green-500/10 text-green-600"
        icon={<TrendingUp className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'planned-trips',
    title: 'Запланировано',
    icon: <Calendar className="h-5 w-5" />,
    category: 'trips',
    defaultVisible: false,
    render: (stats) => (
      <StatWidget
        value={stats.plannedTrips}
        subtitle="ожидают отправки"
        iconBgClass="bg-blue-500/10 text-blue-600"
        icon={<Calendar className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'revenue',
    title: 'Выручка',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'finance',
    defaultVisible: true,
    render: (stats) => (
      <StatWidget
        value={formatCurrency(stats.totalCargoValue || 0)}
        subtitle={`Завершено: ${formatCurrency(stats.completedCargoValue || 0)}`}
        iconBgClass="bg-emerald-500/10 text-emerald-600"
        icon={<DollarSign className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'expenses',
    title: 'Расходы',
    icon: <TrendingDown className="h-5 w-5" />,
    category: 'finance',
    defaultVisible: false,
    render: (stats) => (
      <StatWidget
        value={formatCurrency(stats.totalExpenses || 0)}
        subtitle="за период"
        iconBgClass="bg-red-500/10 text-red-600"
        icon={<TrendingDown className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'profit',
    title: 'Прибыль',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'finance',
    defaultVisible: true,
    render: (stats) => {
      const profit = stats.profit || 0;
      const isPositive = profit >= 0;
      return (
        <StatWidget
          value={formatCurrency(profit)}
          subtitle={`Маржа: ${stats.profitMargin?.toFixed(1) || 0}%`}
          iconBgClass={isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}
          icon={<BarChart3 className="h-5 w-5" />}
          trend={isPositive ? { value: stats.profitMargin || 0, isPositive: true } : undefined}
        />
      );
    },
  },
  {
    id: 'contractors',
    title: 'Контрагенты',
    icon: <Building2 className="h-5 w-5" />,
    category: 'resources',
    defaultVisible: true,
    render: (stats) => (
      <StatWidget
        value={stats.contractors}
        subtitle="в базе"
        iconBgClass="bg-purple-500/10 text-purple-600"
        icon={<Building2 className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'drivers',
    title: 'Водители',
    icon: <Users className="h-5 w-5" />,
    category: 'resources',
    defaultVisible: true,
    render: (stats) => (
      <StatWidget
        value={stats.drivers}
        subtitle="активных"
        iconBgClass="bg-amber-500/10 text-amber-600"
        icon={<Users className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'vehicles',
    title: 'Транспорт',
    icon: <Car className="h-5 w-5" />,
    category: 'resources',
    defaultVisible: true,
    render: (stats) => (
      <StatWidget
        value={stats.vehicles}
        subtitle="в парке"
        iconBgClass="bg-indigo-500/10 text-indigo-600"
        icon={<Car className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'total-weight',
    title: 'Общий вес',
    icon: <Package className="h-5 w-5" />,
    category: 'analytics',
    defaultVisible: false,
    render: (stats) => (
      <StatWidget
        value={formatWeight(stats.totalWeight || 0)}
        subtitle="перевезено"
        iconBgClass="bg-orange-500/10 text-orange-600"
        icon={<Package className="h-5 w-5" />}
      />
    ),
  },
  {
    id: 'avg-cargo-value',
    title: 'Средний чек',
    icon: <Route className="h-5 w-5" />,
    category: 'analytics',
    defaultVisible: false,
    render: (stats) => (
      <StatWidget
        value={formatCurrency(stats.averageCargoValue || 0)}
        subtitle="на рейс"
        iconBgClass="bg-teal-500/10 text-teal-600"
        icon={<Route className="h-5 w-5" />}
      />
    ),
  },
];

interface StatWidgetProps {
  value: string | number;
  subtitle?: string;
  iconBgClass: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}

const StatWidget: React.FC<StatWidgetProps> = ({ value, subtitle, iconBgClass, icon, trend }) => (
  <div className="flex items-start justify-between h-full">
    <div className="space-y-2">
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trend.isPositive ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%</span>
        </div>
      )}
    </div>
    <div className={`stat-card-icon ${iconBgClass}`}>
      {icon}
    </div>
  </div>
);

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ stats }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settings } = useQuery({
    queryKey: ['dashboard-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
      }
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: { widget_layout?: any[]; hidden_widgets?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_dashboard_settings')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings'] });
    },
  });

  const hiddenWidgets: string[] = (settings?.hidden_widgets as string[]) || [];
  const widgetLayout: string[] = Array.isArray(settings?.widget_layout) 
    ? (settings.widget_layout as string[]) 
    : widgetConfigs.map(w => w.id);

  const visibleWidgets = widgetConfigs
    .filter(w => !hiddenWidgets.includes(w.id))
    .sort((a, b) => {
      const aIndex = widgetLayout.indexOf(a.id);
      const bIndex = widgetLayout.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  const toggleWidget = (widgetId: string) => {
    const newHidden = hiddenWidgets.includes(widgetId)
      ? hiddenWidgets.filter((id: string) => id !== widgetId)
      : [...hiddenWidgets, widgetId];
    updateSettings.mutate({ hidden_widgets: newHidden });
  };

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedId(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentLayout = [...widgetLayout];
    const draggedIndex = currentLayout.indexOf(draggedId);
    const targetIndex = currentLayout.indexOf(targetId);

    if (draggedIndex === -1) {
      currentLayout.push(draggedId);
    } else {
      currentLayout.splice(draggedIndex, 1);
    }

    const insertIndex = targetIndex === -1 ? currentLayout.length : targetIndex;
    currentLayout.splice(insertIndex, 0, draggedId);

    updateSettings.mutate({ widget_layout: currentLayout });
    setDraggedId(null);
  };

  const categoryLabels: Record<string, string> = {
    trips: 'Рейсы',
    finance: 'Финансы',
    resources: 'Ресурсы',
    analytics: 'Аналитика',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Статистика</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-4 w-4" />
          Настроить
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {visibleWidgets.map((widget) => (
          <Card 
            key={widget.id}
            draggable
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
            className={cn(
              "stat-card group cursor-grab active:cursor-grabbing transition-all",
              draggedId === widget.id && "opacity-50 scale-95"
            )}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {widget.render(stats)}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Настройка виджетов</DialogTitle>
            <DialogDescription>
              Включите или отключите виджеты статистики
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(categoryLabels).map(([category, label]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium mb-3">{label}</h4>
                  <div className="space-y-2">
                    {widgetConfigs
                      .filter(w => w.category === category)
                      .map(widget => (
                        <div 
                          key={widget.id}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              {widget.icon}
                            </div>
                            <span className="text-sm font-medium">{widget.title}</span>
                          </div>
                          <Switch
                            checked={!hiddenWidgets.includes(widget.id)}
                            onCheckedChange={() => toggleWidget(widget.id)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};