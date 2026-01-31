import React, { useState, useCallback } from 'react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, TrendingDown, DollarSign, Truck, AlertCircle, Sparkles, RefreshCw, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import { formatCurrency } from '@/lib/formatters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface FinancialSummary {
  totalTrips: number;
  completedTrips: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: string | number;
  expensesByCategory: Record<string, number>;
  monthlyData: Record<string, { revenue: number; expenses: number }>;
}

export const FinancialAnalyticsPage: React.FC = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Ошибка', description: 'Требуется авторизация', variant: 'destructive' });
        return;
      }

      const response = await fetch(
        `https://xibihgkkubkcjdibysni.supabase.co/functions/v1/financial-analytics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            action: 'get_summary',
            dateRange: dateRange ? {
              from: dateRange.from?.toISOString(),
              to: dateRange.to?.toISOString(),
            } : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка загрузки данных');
      }

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [dateRange, toast]);

  const runAiAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Ошибка', description: 'Требуется авторизация', variant: 'destructive' });
        return;
      }

      const response = await fetch(
        `https://xibihgkkubkcjdibysni.supabase.co/functions/v1/financial-analytics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            action: 'analyze',
            dateRange: dateRange ? {
              from: dateRange.from?.toISOString(),
              to: dateRange.to?.toISOString(),
            } : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка анализа');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

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
              setAiAnalysis(analysisText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось выполнить анализ',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [dateRange, toast]);

  const expenseCategoryLabels: Record<string, string> = {
    fuel: 'Топливо',
    tolls: 'Дорожные сборы',
    parking: 'Парковка',
    maintenance: 'Обслуживание',
    food: 'Питание',
    accommodation: 'Проживание',
    other: 'Прочее',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Финансовая аналитика"
        description="AI-анализ финансовой ситуации и рекомендации"
      />

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd.MM.yyyy', { locale: ru })} -{' '}
                        {format(dateRange.to, 'dd.MM.yyyy', { locale: ru })}
                      </>
                    ) : (
                      format(dateRange.from, 'dd.MM.yyyy', { locale: ru })
                    )
                  ) : (
                    'Выберите период'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={fetchSummary} disabled={isLoadingSummary}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSummary ? 'animate-spin' : ''}`} />
              Загрузить данные
            </Button>

            {summary && (
              <Button onClick={runAiAnalysis} disabled={isAnalyzing} variant="default" className="gap-2">
                <Brain className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                {isAnalyzing ? 'Анализирую...' : 'AI-анализ'}
              </Button>
            )}

            {dateRange && (
              <Button variant="ghost" onClick={() => setDateRange(undefined)}>
                Сбросить фильтр
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {isLoadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(summary.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalTrips} рейсов
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Расходы</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(summary.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(summary.expensesByCategory).length} категорий
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Чистая прибыль</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(summary.netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Рентабельность: {summary.profitMargin}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Рейсы</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.completedTrips}/{summary.totalTrips}
                </div>
                <Progress 
                  value={summary.totalTrips > 0 ? (summary.completedTrips / summary.totalTrips) * 100 : 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Expenses Breakdown */}
          {Object.keys(summary.expensesByCategory).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Структура расходов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(summary.expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = summary.totalExpenses > 0 
                        ? (amount / summary.totalExpenses) * 100 
                        : 0;
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{expenseCategoryLabels[category] || category}</span>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Нажмите "Загрузить данные" для получения финансовой статистики
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {(isAnalyzing || aiAnalysis) && (
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI-анализ и рекомендации</CardTitle>
            </div>
            <CardDescription>
              Автоматический анализ финансовой ситуации с помощью нейросети
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isAnalyzing && !aiAnalysis && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                <span className="text-muted-foreground">Анализирую данные...</span>
              </div>
            )}
            {aiAnalysis && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialAnalyticsPage;
