import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, Fuel, Calculator, Route } from 'lucide-react';
import { 
  calculateRouteBetweenAddresses, 
  calculateFuelConsumption, 
  estimateFuelCost,
  RouteResult 
} from '@/services/routingService';
import { toast } from 'sonner';

interface RouteCalculatorProps {
  initialFrom?: string;
  initialTo?: string;
  onRouteCalculated?: (result: RouteResult & { fuelConsumption: number; fuelCost: number }) => void;
}

export const RouteCalculator: React.FC<RouteCalculatorProps> = ({
  initialFrom = '',
  initialTo = '',
  onRouteCalculated
}) => {
  const [fromAddress, setFromAddress] = useState(initialFrom);
  const [toAddress, setToAddress] = useState(initialTo);
  const [fuelConsumption, setFuelConsumption] = useState(30); // L/100km
  const [fuelPrice, setFuelPrice] = useState(55); // RUB/L
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);

  const handleCalculate = async () => {
    if (!fromAddress.trim() || !toAddress.trim()) {
      toast.error('Введите адреса отправления и назначения');
      return;
    }

    setLoading(true);
    try {
      const routeResult = await calculateRouteBetweenAddresses(fromAddress, toAddress);
      
      if (!routeResult) {
        toast.error('Не удалось рассчитать маршрут. Проверьте адреса.');
        return;
      }

      setResult(routeResult);

      const fuelNeeded = calculateFuelConsumption(routeResult.distance, fuelConsumption);
      const fuelCost = estimateFuelCost(routeResult.distance, fuelConsumption, fuelPrice);

      toast.success(`Маршрут рассчитан: ${routeResult.distance.toFixed(1)} км`);

      if (onRouteCalculated) {
        onRouteCalculated({
          ...routeResult,
          fuelConsumption: fuelNeeded,
          fuelCost
        });
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      toast.error('Ошибка при расчёте маршрута');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} ч ${m} мин`;
  };

  const calculatedFuel = result ? calculateFuelConsumption(result.distance, fuelConsumption) : 0;
  const calculatedFuelCost = result ? estimateFuelCost(result.distance, fuelConsumption, fuelPrice) : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
          </div>
          Калькулятор маршрута
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-green-500" />
              Откуда
            </Label>
            <Input
              id="from"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="Москва, ул. Ленина 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-red-500" />
              Куда
            </Label>
            <Input
              id="to"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="Санкт-Петербург, Невский пр. 1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="consumption" className="flex items-center gap-1.5">
              <Fuel className="h-4 w-4" />
              Расход (л/100км)
            </Label>
            <Input
              id="consumption"
              type="number"
              value={fuelConsumption}
              onChange={(e) => setFuelConsumption(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4" />
              Цена топлива (₽/л)
            </Label>
            <Input
              id="price"
              type="number"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(Number(e.target.value))}
              min={1}
            />
          </div>
        </div>

        <Button 
          onClick={handleCalculate} 
          disabled={loading} 
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Расчёт маршрута...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Рассчитать
            </>
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
            <h4 className="font-medium mb-3">Результаты расчёта</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-background">
                <Badge variant="outline" className="mb-2">
                  <MapPin className="h-3 w-3 mr-1 text-primary" />
                  Расстояние
                </Badge>
                <p className="text-xl font-bold">{result.distance.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">км</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-background">
                <Badge variant="outline" className="mb-2">
                  <Clock className="h-3 w-3 mr-1 text-primary" />
                  Время
                </Badge>
                <p className="text-xl font-bold">{formatDuration(result.duration)}</p>
                <p className="text-xs text-muted-foreground">в пути</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-background">
                <Badge variant="outline" className="mb-2">
                  <Fuel className="h-3 w-3 mr-1" />
                  Топливо
                </Badge>
                <p className="text-xl font-bold">{calculatedFuel.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">литров</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-background">
                <Badge variant="outline" className="mb-2">
                  <Calculator className="h-3 w-3 mr-1" />
                  Стоимость
                </Badge>
                <p className="text-xl font-bold">{calculatedFuelCost.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">₽</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
