
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { TripStatus } from '@/types';

interface TripListFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddTrip: () => void;
}

export const TripListFilters: React.FC<TripListFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddTrip
}) => {
  return (
    <div className="space-y-4">
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
      
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-48 h-12">
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
    </div>
  );
};
