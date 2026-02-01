import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, TrendingUp, Calendar, Truck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface ForecastData {
  month: string;
  actual?: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
}

export const LoadForecasting: React.FC = () => {
  const [forecast, setForecast] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch historical data
  const { data: historicalData = [], isLoading } = useQuery({
    queryKey: ['historical-trips-data'],
    queryFn: async () => {
      const months: ForecastData[] = [];
      const now = new Date();

      // Get last 12 months of data
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);

        const { data: trips, error } = await supabase
          .from('trips')
          .select('id, cargo_value, cargo_weight, status')
          .gte('departure_date', start.toISOString())
          .lte('departure_date', end.toISOString())
          .neq('status', 'cancelled');

        if (error) {
          console.error('Error fetching trips:', error);
          continue;
        }

        const totalTrips = trips?.length || 0;
        const revenue = trips?.reduce((sum, t) => sum + (Number(t.cargo_value) || 0), 0) || 0;

        months.push({
          month: format(monthDate, 'MMM yy', { locale: ru }),
          actual: totalTrips,
        });
      }

      return months;
    },
  });

  const runForecast = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      setForecast('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Prepare data for AI
      const dataPoints = historicalData.map((d, i) => ({
        month: d.month,
        trips: d.actual,
        index: i,
      }));

      const response = await fetch(
        `https://xibihgkkubkcjdibysni.supabase.co/functions/v1/financial-analytics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'forecast',
            historicalData: dataPoints,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Forecast error');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let analysisText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              analysisText += content;
              setForecast(analysisText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      return analysisText;
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });

  // Simple trend calculation for visualization
  const chartData = React.useMemo(() => {
    if (historicalData.length < 3) return historicalData;

    // Calculate simple moving average and trend
    const data = [...historicalData];
    const lastValues = data.slice(-3).map(d => d.actual || 0);
    const avgGrowth = lastValues.length > 1 
      ? (lastValues[lastValues.length - 1] - lastValues[0]) / lastValues.length 
      : 0;

    // Add 3 months of predictions
    const lastValue = lastValues[lastValues.length - 1] || 0;
    const now = new Date();

    for (let i = 1; i <= 3; i++) {
      const monthDate = subMonths(now, -i);
      const predicted = Math.max(0, Math.round(lastValue + avgGrowth * i));
      data.push({
        month: format(monthDate, 'MMM yy', { locale: ru }),
        predicted,
        lowerBound: Math.max(0, predicted - Math.round(predicted * 0.2)),
        upperBound: predicted + Math.round(predicted * 0.2),
      });
    }

    return data;
  }, [historicalData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Прогнозирование загрузки
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Прогнозирование загрузки
            <Badge variant="secondary" className="ml-2">AI</Badge>
          </CardTitle>
          <CardDescription>
            ML-прогноз на основе исторических данных
          </CardDescription>
        </div>
        <Button 
          onClick={() => runForecast.mutate()} 
          disabled={isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Анализ...' : 'Получить прогноз'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {/* Prediction confidence interval */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="hsl(var(--primary) / 0.1)"
                name="Верхняя граница"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="hsl(var(--background))"
                name="Нижняя граница"
              />
              
              {/* Actual data */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Факт"
              />
              
              {/* Predictions */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                name="Прогноз"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Последний месяц
            </div>
            <p className="text-xl font-bold">
              {historicalData[historicalData.length - 1]?.actual || 0} рейсов
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Прогноз (+1 мес)
            </div>
            <p className="text-xl font-bold">
              {chartData.find(d => d.predicted)?.predicted || '—'} рейсов
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Truck className="h-4 w-4" />
              Среднее за год
            </div>
            <p className="text-xl font-bold">
              {Math.round(historicalData.reduce((sum, d) => sum + (d.actual || 0), 0) / Math.max(historicalData.length, 1))} рейсов
            </p>
          </div>
        </div>

        {/* AI Analysis */}
        {(isAnalyzing || forecast) && (
          <div className="border rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-medium">AI-анализ и рекомендации</h4>
            </div>
            {isAnalyzing && !forecast && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Анализирую данные...
              </div>
            )}
            {forecast && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown>{forecast}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Warning if not enough data */}
        {historicalData.length < 6 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Недостаточно данных для точного прогноза
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Для более точного прогноза необходимо минимум 6 месяцев исторических данных. 
                Сейчас доступно: {historicalData.length} месяцев.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};