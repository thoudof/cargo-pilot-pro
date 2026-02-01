import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowLeftRight, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type ComparisonType = 'month' | 'year';

interface PeriodData {
  trips: number;
  completedTrips: number;
  revenue: number;
  expenses: number;
  profit: number;
  weight: number;
  avgCargoValue: number;
}

interface ComparisonResult {
  current: PeriodData;
  previous: PeriodData;
  changes: {
    trips: number;
    completedTrips: number;
    revenue: number;
    expenses: number;
    profit: number;
    weight: number;
    avgCargoValue: number;
  };
}

export const PeriodComparison: React.FC = () => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('month');
  const [selectedPeriod, setSelectedPeriod] = useState(0); // 0 = current, -1 = previous, etc.

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['period-comparison', comparisonType, selectedPeriod],
    queryFn: async (): Promise<ComparisonResult> => {
      const now = new Date();
      let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

      if (comparisonType === 'month') {
        const currentMonth = subMonths(now, Math.abs(selectedPeriod));
        currentStart = startOfMonth(currentMonth);
        currentEnd = endOfMonth(currentMonth);
        
        const prevMonth = subMonths(currentMonth, 1);
        previousStart = startOfMonth(prevMonth);
        previousEnd = endOfMonth(prevMonth);
      } else {
        const currentYear = subYears(now, Math.abs(selectedPeriod));
        currentStart = startOfYear(currentYear);
        currentEnd = endOfYear(currentYear);
        
        const prevYear = subYears(currentYear, 1);
        previousStart = startOfYear(prevYear);
        previousEnd = endOfYear(prevYear);
      }

      const fetchPeriodData = async (start: Date, end: Date): Promise<PeriodData> => {
        const { data: trips, error } = await supabase
          .from('trips')
          .select('*, trip_expenses(*)')
          .gte('departure_date', start.toISOString())
          .lte('departure_date', end.toISOString())
          .neq('status', 'cancelled');

        if (error) throw error;

        const completedTrips = trips?.filter(t => t.status === 'completed').length || 0;
        const revenue = trips?.reduce((sum, t) => sum + (Number(t.cargo_value) || 0), 0) || 0;
        const expenses = trips?.reduce((sum, t) => {
          const tripExp = t.trip_expenses?.reduce((expSum: number, exp: any) => 
            expSum + (Number(exp.amount) || 0), 0) || 0;
          return sum + tripExp;
        }, 0) || 0;
        const weight = trips?.reduce((sum, t) => sum + (Number(t.cargo_weight) || 0), 0) || 0;

        return {
          trips: trips?.length || 0,
          completedTrips,
          revenue,
          expenses,
          profit: revenue - expenses,
          weight,
          avgCargoValue: completedTrips > 0 ? revenue / completedTrips : 0,
        };
      };

      const [current, previous] = await Promise.all([
        fetchPeriodData(currentStart, currentEnd),
        fetchPeriodData(previousStart, previousEnd),
      ]);

      const calculateChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      return {
        current,
        previous,
        changes: {
          trips: calculateChange(current.trips, previous.trips),
          completedTrips: calculateChange(current.completedTrips, previous.completedTrips),
          revenue: calculateChange(current.revenue, previous.revenue),
          expenses: calculateChange(current.expenses, previous.expenses),
          profit: calculateChange(current.profit, previous.profit),
          weight: calculateChange(current.weight, previous.weight),
          avgCargoValue: calculateChange(current.avgCargoValue, previous.avgCargoValue),
        },
      };
    },
  });

  const chartData = useMemo(() => {
    if (!comparison) return [];
    
    return [
      {
        name: 'Рейсы',
        current: comparison.current.trips,
        previous: comparison.previous.trips,
      },
      {
        name: 'Завершённые',
        current: comparison.current.completedTrips,
        previous: comparison.previous.completedTrips,
      },
    ];
  }, [comparison]);

  const revenueChartData = useMemo(() => {
    if (!comparison) return [];
    
    return [
      {
        name: 'Выручка',
        current: comparison.current.revenue,
        previous: comparison.previous.revenue,
      },
      {
        name: 'Расходы',
        current: comparison.current.expenses,
        previous: comparison.previous.expenses,
      },
      {
        name: 'Прибыль',
        current: comparison.current.profit,
        previous: comparison.previous.profit,
      },
    ];
  }, [comparison]);

  const getPeriodLabel = () => {
    const now = new Date();
    if (comparisonType === 'month') {
      const current = subMonths(now, Math.abs(selectedPeriod));
      const previous = subMonths(current, 1);
      return {
        current: format(current, 'LLLL yyyy', { locale: ru }),
        previous: format(previous, 'LLLL yyyy', { locale: ru }),
      };
    } else {
      const current = subYears(now, Math.abs(selectedPeriod));
      const previous = subYears(current, 1);
      return {
        current: format(current, 'yyyy'),
        previous: format(previous, 'yyyy'),
      };
    }
  };

  const periodLabels = getPeriodLabel();

  const renderChangeIndicator = (value: number, inverse = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNeutral = Math.abs(value) < 0.5;

    if (isNeutral) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span>0%</span>
        </div>
      );
    }

    return (
      <div className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Сравнение периодов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Сравнение периодов
            </CardTitle>
            <CardDescription className="mt-1">
              {periodLabels.current} vs {periodLabels.previous}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={comparisonType} onValueChange={(v) => setComparisonType(v as ComparisonType)}>
              <TabsList>
                <TabsTrigger value="month">По месяцам</TabsTrigger>
                <TabsTrigger value="year">По годам</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select 
              value={selectedPeriod.toString()} 
              onValueChange={(v) => setSelectedPeriod(parseInt(v))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Текущий период</SelectItem>
                <SelectItem value="-1">Предыдущий период</SelectItem>
                <SelectItem value="-2">2 периода назад</SelectItem>
                <SelectItem value="-3">3 периода назад</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key metrics comparison */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Рейсы</p>
            <p className="text-2xl font-bold mt-1">{comparison?.current.trips || 0}</p>
            <div className="mt-2">
              {comparison && renderChangeIndicator(comparison.changes.trips)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              было: {comparison?.previous.trips || 0}
            </p>
          </div>

          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Выручка</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(comparison?.current.revenue || 0)}</p>
            <div className="mt-2">
              {comparison && renderChangeIndicator(comparison.changes.revenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              было: {formatCurrency(comparison?.previous.revenue || 0)}
            </p>
          </div>

          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Расходы</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(comparison?.current.expenses || 0)}</p>
            <div className="mt-2">
              {comparison && renderChangeIndicator(comparison.changes.expenses, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              было: {formatCurrency(comparison?.previous.expenses || 0)}
            </p>
          </div>

          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Прибыль</p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              (comparison?.current.profit || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(comparison?.current.profit || 0)}
            </p>
            <div className="mt-2">
              {comparison && renderChangeIndicator(comparison.changes.profit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              было: {formatCurrency(comparison?.previous.profit || 0)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-[250px]">
            <h4 className="text-sm font-medium mb-4">Рейсы</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" name={periodLabels.current} fill="hsl(var(--primary))" />
                <Bar dataKey="previous" name={periodLabels.previous} fill="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[250px]">
            <h4 className="text-sm font-medium mb-4">Финансы</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}к`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="current" name={periodLabels.current} fill="hsl(var(--primary))" />
                <Bar dataKey="previous" name={periodLabels.previous} fill="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};