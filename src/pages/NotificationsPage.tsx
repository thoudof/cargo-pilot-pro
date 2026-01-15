import React from 'react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { NotificationHistory } from '@/components/Notifications/NotificationHistory';

const NotificationsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader 
        title="Уведомления" 
        description="Просмотр истории всех уведомлений системы"
      />
      <NotificationHistory />
    </div>
  );
};

export default NotificationsPage;
