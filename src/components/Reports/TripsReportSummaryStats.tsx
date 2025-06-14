
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, DollarSign, Calculator, Target } from 'lucide-react';

interface SummaryStatsData {
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  cancelledTrips: number;
  actualRevenue: number;
  actualExpenses: number;
  actualProfit: number;
  potentialRevenue: number;
  potentialExpenses: number;
  potentialProfit: number;
  totalRevenue: number;
  totalExpenses: number;
  totalWeight: number;
  actualProfitMargin: number;
  potentialProfitMargin: number;
  overallProfitMargin: number;
}

interface TripsReportSummaryStatsProps {
  summaryStats: SummaryStatsData;
}

export const TripsReportSummaryStats: React.FC<TripsReportSummaryStatsProps> = ({ summaryStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Общая статистика */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Всего рейсов</div>
          <div className="text-2xl font-bold">{summaryStats.totalTrips}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Завершено: {summaryStats.completedTrips} | Активных: {summaryStats.activeTrips} | Отменено: {summaryStats.cancelledTrips}
          </div>
        </CardContent>
      </Card>

      {/* Фактическая прибыль */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div className="text-sm text-muted-foreground">Фактическая прибыль</div>
          </div>
          <div className={`text-2xl font-bold ${summaryStats.actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summaryStats.actualProfit.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Рентабельность: {summaryStats.actualProfitMargin.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      {/* Потенциальная прибыль */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <div className="text-sm text-muted-foreground">Потенциальная прибыль</div>
          </div>
          <div className={`text-2xl font-bold ${summaryStats.potentialProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {summaryStats.potentialProfit.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Ожидаемая рентабельность: {summaryStats.potentialProfitMargin.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      {/* Общие доходы */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <div className="text-sm text-muted-foreground">Общие доходы</div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {summaryStats.totalRevenue.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Факт: {summaryStats.actualRevenue.toLocaleString('ru-RU')} ₽ | План: {summaryStats.potentialRevenue.toLocaleString('ru-RU')} ₽
          </div>
        </CardContent>
      </Card>

      {/* Общие расходы */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <div className="text-sm text-muted-foreground">Общие расходы</div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {summaryStats.totalExpenses.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Факт: {summaryStats.actualExpenses.toLocaleString('ru-RU')} ₽ | План: {summaryStats.potentialExpenses.toLocaleString('ru-RU')} ₽
          </div>
        </CardContent>
      </Card>

      {/* Общий вес */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Общий вес</div>
          <div className="text-2xl font-bold">
            {summaryStats.totalWeight.toFixed(1)} т
          </div>
        </CardContent>
      </Card>

      {/* Общая рентабельность */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-purple-600" />
            <div className="text-sm text-muted-foreground">Общая рентабельность</div>
          </div>
          <div className={`text-2xl font-bold ${summaryStats.overallProfitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            {summaryStats.overallProfitMargin.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      {/* Итоговая прибыль */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <div className="text-sm text-muted-foreground">Итоговая прибыль</div>
          </div>
          <div className={`text-2xl font-bold ${(summaryStats.actualProfit + summaryStats.potentialProfit) >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {(summaryStats.actualProfit + summaryStats.potentialProfit).toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Факт + Потенциал
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

