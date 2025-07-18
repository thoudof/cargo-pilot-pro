
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, FileText, Filter, X, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TripStatus } from '@/types';
import { TripWithExpenses } from '@/types/reports';
import { TripsReportDetailedTable } from './TripsReportDetailedTable';

interface AdvancedFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  minValue: string;
  maxValue: string;
  minProfit: string;
  maxProfit: string;
  selectedContractors: string[];
  searchBy: 'all' | 'route' | 'driver' | 'contractor' | 'cargo';
}

interface TripsReportFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onExport: () => void;
  trips: TripWithExpenses[];
  contractors: Record<string, string>;
  onSort: (field: string) => void;
}

export const TripsReportFilters: React.FC<TripsReportFiltersProps> = ({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  onExport,
  trips,
  contractors,
  onSort,
}) => {
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    minValue: '',
    maxValue: '',
    minProfit: '',
    maxProfit: '',
    selectedContractors: [],
    searchBy: 'all'
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const contractorOptions = Object.entries(contractors).map(([id, name]) => ({ id, name }));

  const applyAdvancedFilters = (trips: TripWithExpenses[]): TripWithExpenses[] => {
    return trips.filter(trip => {
      // Date range filter
      if (advancedFilters.dateFrom) {
        const tripDate = new Date(trip.departureDate);
        if (tripDate < advancedFilters.dateFrom) return false;
      }
      if (advancedFilters.dateTo) {
        const tripDate = new Date(trip.departureDate);
        if (tripDate > advancedFilters.dateTo) return false;
      }

      // Value range filter
      const cargoValue = trip.cargo?.value || 0;
      if (advancedFilters.minValue && cargoValue < Number(advancedFilters.minValue)) return false;
      if (advancedFilters.maxValue && cargoValue > Number(advancedFilters.maxValue)) return false;

      // Profit range filter
      const profit = trip.isProfitActual ? trip.actualProfit : trip.potentialProfit;
      if (advancedFilters.minProfit && profit < Number(advancedFilters.minProfit)) return false;
      if (advancedFilters.maxProfit && profit > Number(advancedFilters.maxProfit)) return false;

      // Contractor filter
      if (advancedFilters.selectedContractors.length > 0) {
        if (!advancedFilters.selectedContractors.includes(trip.contractorId)) return false;
      }

      return true;
    });
  };

  const applySearchFilter = (trips: TripWithExpenses[]): TripWithExpenses[] => {
    if (!searchTerm.trim()) return trips;

    const searchLower = searchTerm.toLowerCase();
    
    return trips.filter(trip => {
      switch (advancedFilters.searchBy) {
        case 'route':
          return `${trip.pointA} ${trip.pointB}`.toLowerCase().includes(searchLower);
        case 'driver':
          return `${trip.driver.name} ${trip.driver.phone}`.toLowerCase().includes(searchLower);
        case 'contractor':
          return contractors[trip.contractorId]?.toLowerCase().includes(searchLower);
        case 'cargo':
          return trip.cargo?.description?.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            `${trip.pointA} ${trip.pointB}`.toLowerCase().includes(searchLower) ||
            `${trip.driver.name} ${trip.driver.phone}`.toLowerCase().includes(searchLower) ||
            contractors[trip.contractorId]?.toLowerCase().includes(searchLower) ||
            trip.cargo?.description?.toLowerCase().includes(searchLower) ||
            `${trip.vehicle.brand} ${trip.vehicle.model} ${trip.vehicle.licensePlate}`.toLowerCase().includes(searchLower)
          );
      }
    });
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (advancedFilters.dateFrom || advancedFilters.dateTo) count++;
    if (advancedFilters.minValue || advancedFilters.maxValue) count++;
    if (advancedFilters.minProfit || advancedFilters.maxProfit) count++;
    if (advancedFilters.selectedContractors.length > 0) count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      dateFrom: undefined,
      dateTo: undefined,
      minValue: '',
      maxValue: '',
      minProfit: '',
      maxProfit: '',
      selectedContractors: [],
      searchBy: 'all'
    });
    onStatusFilterChange('all');
  };

  // Apply filters in sequence: basic status → advanced → search
  const statusFilteredTrips = statusFilter === 'all' 
    ? trips 
    : trips.filter(trip => trip.status === statusFilter);
  
  const advancedFilteredTrips = applyAdvancedFilters(statusFilteredTrips);
  const finalFilteredTrips = applySearchFilter(advancedFilteredTrips);

  const activeFiltersCount = getActiveFiltersCount();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Детальная таблица рейсов</span>
          <Button variant="outline" size="sm" onClick={onExport}>
            <FileText className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic filters row */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по маршруту, водителю, контрагенту..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={advancedFilters.searchBy} onValueChange={(value) => 
              setAdvancedFilters(prev => ({ ...prev, searchBy: value as AdvancedFilters['searchBy'] }))
            }>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Везде</SelectItem>
                <SelectItem value="route">Маршрут</SelectItem>
                <SelectItem value="driver">Водитель</SelectItem>
                <SelectItem value="contractor">Контрагент</SelectItem>
                <SelectItem value="cargo">Груз</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value={TripStatus.PLANNED}>Планируется</SelectItem>
                <SelectItem value={TripStatus.IN_PROGRESS}>В пути</SelectItem>
                <SelectItem value={TripStatus.COMPLETED}>Завершён</SelectItem>
                <SelectItem value={TripStatus.CANCELLED}>Отменён</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced filters button */}
            <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтры
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Расширенные фильтры</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Date range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Период дат</label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {advancedFilters.dateFrom ? format(advancedFilters.dateFrom, "dd.MM.yyyy", { locale: ru }) : "От даты"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={advancedFilters.dateFrom}
                            onSelect={(date) => setAdvancedFilters(prev => ({ ...prev, dateFrom: date }))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {advancedFilters.dateTo ? format(advancedFilters.dateTo, "dd.MM.yyyy", { locale: ru }) : "До даты"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={advancedFilters.dateTo}
                            onSelect={(date) => setAdvancedFilters(prev => ({ ...prev, dateTo: date }))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Value range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Стоимость груза (₽)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="От"
                        value={advancedFilters.minValue}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minValue: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="До"
                        value={advancedFilters.maxValue}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Profit range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Прибыль (₽)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="От"
                        value={advancedFilters.minProfit}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minProfit: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="До"
                        value={advancedFilters.maxProfit}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxProfit: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Contractor selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Контрагенты</label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                      {contractorOptions.map(contractor => (
                        <label key={contractor.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={advancedFilters.selectedContractors.includes(contractor.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  selectedContractors: [...prev.selectedContractors, contractor.id]
                                }));
                              } else {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  selectedContractors: prev.selectedContractors.filter(id => id !== contractor.id)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{contractor.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={clearAdvancedFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Очистить все
                    </Button>
                    <Button onClick={() => setIsAdvancedOpen(false)}>
                      Применить фильтры
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {advancedFilters.dateFrom && (
                <Badge variant="secondary" className="gap-1">
                  От: {format(advancedFilters.dateFrom, "dd.MM.yyyy", { locale: ru })}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setAdvancedFilters(prev => ({ ...prev, dateFrom: undefined }))}
                  />
                </Badge>
              )}
              {advancedFilters.dateTo && (
                <Badge variant="secondary" className="gap-1">
                  До: {format(advancedFilters.dateTo, "dd.MM.yyyy", { locale: ru })}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setAdvancedFilters(prev => ({ ...prev, dateTo: undefined }))}
                  />
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Статус: {statusFilter === TripStatus.PLANNED ? 'Планируется' : 
                           statusFilter === TripStatus.IN_PROGRESS ? 'В пути' :
                           statusFilter === TripStatus.COMPLETED ? 'Завершён' : 'Отменён'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onStatusFilterChange('all')}
                  />
                </Badge>
              )}
              {advancedFilters.selectedContractors.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Контрагенты: {advancedFilters.selectedContractors.length}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setAdvancedFilters(prev => ({ ...prev, selectedContractors: [] }))}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          <TripsReportDetailedTable
            trips={finalFilteredTrips}
            contractors={contractors}
            onSort={onSort}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
          />
        </div>
      </CardContent>
    </Card>
  );
};
