
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TripWithExpenses, statusLabels, statusColors } from '@/types/reports';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripsReportDetailedTableProps {
  trips: TripWithExpenses[];
  contractors: Record<string, string>;
  onSort: (field: string) => void;
  // sortField: string; // Not directly used for rendering sort indicators in this version
  // sortDirection: 'asc' | 'desc'; // Not directly used for rendering sort indicators
  searchTerm: string;
  statusFilter: string;
}

export const TripsReportDetailedTable: React.FC<TripsReportDetailedTableProps> = ({
  trips,
  contractors,
  onSort,
  searchTerm,
  statusFilter,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">№</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('route')}
            >
              Маршрут
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('departureDate')}
            >
              Дата отправления
            </TableHead>
            <TableHead>Водитель</TableHead>
            <TableHead>Транспорт</TableHead>
            <TableHead>Контрагент</TableHead>
            <TableHead>Вес/Объем</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => onSort('revenue')}
            >
              Доход
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => onSort('expenses')}
            >
              Расходы
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => onSort('actualProfit')}
            >
              Фактическая прибыль
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => onSort('potentialProfit')}
            >
              Потенциальная прибыль
            </TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip, index) => (
            <TableRow key={trip.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <div className="font-medium">{trip.pointA} → {trip.pointB}</div>
                <div className="text-sm text-muted-foreground">
                  {trip.cargo?.description}
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(trip.departureDate), 'dd.MM.yyyy', { locale: ru })}
              </TableCell>
              <TableCell>
                <div>{trip.driver.name}</div>
                <div className="text-sm text-muted-foreground">{trip.driver.phone}</div>
              </TableCell>
              <TableCell>
                <div>{trip.vehicle.brand} {trip.vehicle.model}</div>
                <div className="text-sm text-muted-foreground">{trip.vehicle.licensePlate}</div>
              </TableCell>
              <TableCell>
                {contractors[trip.contractorId] || 'Неизвестный'}
              </TableCell>
              <TableCell>
                <div>{(trip.cargo?.weight || 0).toLocaleString('ru-RU')} кг</div>
                <div className="text-sm text-muted-foreground">
                  {(trip.cargo?.volume || 0).toLocaleString('ru-RU')} м³
                </div>
              </TableCell>
              <TableCell className="text-right font-medium text-green-600">
                {(trip.cargo?.value || 0).toLocaleString('ru-RU')} ₽
              </TableCell>
              <TableCell className="text-right font-medium text-red-600">
                {trip.totalExpenses.toLocaleString('ru-RU')} ₽
              </TableCell>
              <TableCell className={`text-right font-medium ${
                trip.isProfitActual 
                  ? (trip.actualProfit >= 0 ? 'text-green-600' : 'text-red-600')
                  : 'text-gray-400'
              }`}>
                {trip.isProfitActual ? `${trip.actualProfit.toLocaleString('ru-RU')} ₽` : '—'}
              </TableCell>
              <TableCell className={`text-right font-medium ${
                !trip.isProfitActual 
                  ? (trip.potentialProfit >= 0 ? 'text-blue-600' : 'text-orange-600')
                  : 'text-gray-400'
              }`}>
                {!trip.isProfitActual ? `${trip.potentialProfit.toLocaleString('ru-RU')} ₽` : '—'}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[trip.status]} text-white border-none`}
                >
                  {statusLabels[trip.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {trips.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'Не найдено рейсов по заданным критериям'
              : 'Нет данных о рейсах'
            }
          </p>
        </div>
      )}
    </div>
  );
};

