import React, { useState } from 'react';
import { TripList } from '@/components/Trips/TripList';
import { TripsCalendar } from '@/components/Trips/TripsCalendar';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Calendar } from 'lucide-react';

export const TripsPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Рейсы" 
        description="Управление рейсами и логистикой"
      />
      
      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Список
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Календарь
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          <TripList />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-4">
          <TripsCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};