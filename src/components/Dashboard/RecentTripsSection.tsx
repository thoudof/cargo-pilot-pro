
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Импортируем Button
import { Calendar, PlusCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom'; // Импортируем useNavigate

interface RecentTripsSectionProps {
  stats: {
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
    plannedTrips: number;
  };
}

export const RecentTripsSection: React.FC<RecentTripsSectionProps> = ({ stats }) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate(); // Инициализируем useNavigate

  const handleShowAllClick = () => {
    toast({
      title: "Функция в разработке",
      description: "Отображение всех рейсов будет добавлено в ближайшее время.",
    });
    console.log("Показать все рейсы - функциональность будет добавлена.");
  };

  const handleCreateNewTrip = () => {
    navigate('/trips'); // Перенаправляем на страницу рейсов
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Последние рейсы</span>
        </CardTitle>
        <button
          className="text-xs sm:text-sm text-primary hover:underline"
          onClick={handleShowAllClick}
        >
          Показать все
        </button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        {stats.totalTrips === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              У вас пока нет рейсов.
            </p>
            <Button size="sm" onClick={handleCreateNewTrip}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать первый рейс
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs sm:text-sm">
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} p-2 border rounded`}>
                <span>Активных рейсов: <strong>{stats.activeTrips}</strong></span>
                <span>Завершенных: <strong>{stats.completedTrips}</strong></span>
                <span>Запланированных: <strong>{stats.plannedTrips}</strong></span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

