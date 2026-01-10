import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Search, Filter, ChevronDown, X, Calendar } from 'lucide-react';
import { TripStatus, Contractor } from '@/types';

interface TripListFiltersAdvancedProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddTrip: () => void;
  contractors: { id: string; companyName: string }[];
  contractorFilter: string;
  onContractorFilterChange: (value: string) => void;
  dateFromFilter: string;
  onDateFromFilterChange: (value: string) => void;
  dateToFilter: string;
  onDateToFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const TripListFiltersAdvanced: React.FC<TripListFiltersAdvancedProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddTrip,
  contractors,
  contractorFilter,
  onContractorFilterChange,
  dateFromFilter,
  onDateFromFilterChange,
  dateToFilter,
  onDateToFilterChange,
  onClearFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasAdvancedFilters = contractorFilter !== 'all' || dateFromFilter || dateToFilter;
  const activeFiltersCount = [
    statusFilter !== 'all',
    contractorFilter !== 'all',
    dateFromFilter,
    dateToFilter
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Main search and add button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск рейсов..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-12"
          />
        </div>
        <Button onClick={onAddTrip} className="h-12 px-6">
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Quick status filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue placeholder="Статус рейса" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value={TripStatus.PLANNED}>Планируется</SelectItem>
            <SelectItem value={TripStatus.IN_PROGRESS}>В пути</SelectItem>
            <SelectItem value={TripStatus.COMPLETED}>Завершён</SelectItem>
            <SelectItem value={TripStatus.CANCELLED}>Отменён</SelectItem>
          </SelectContent>
        </Select>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="h-10 gap-2">
              <Filter className="h-4 w-4" />
              Расширенные фильтры
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          {hasAdvancedFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Сбросить
            </Button>
          )}
        </Collapsible>
      </div>

      {/* Advanced filters */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Контрагент
                  </label>
                  <Select value={contractorFilter} onValueChange={onContractorFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все контрагенты" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все контрагенты</SelectItem>
                      {contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          {contractor.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Дата от
                  </label>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => onDateFromFilterChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Дата до
                  </label>
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => onDateToFilterChange(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
