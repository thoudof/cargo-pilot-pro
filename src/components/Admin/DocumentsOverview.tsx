import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Archive
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DocumentStats {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  totalTemplates: number;
  activeTemplates: number;
  documentsThisMonth: number;
  averageDocumentsPerTrip: number;
  tripCompletionRate: number;
}

export const DocumentsOverview: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn: async (): Promise<DocumentStats> => {
      // Общее количество документов
      const { count: totalDocuments } = await supabase
        .from('trip_documents')
        .select('*', { count: 'exact', head: true });

      // Документы по типам
      const { data: documentTypes } = await supabase
        .from('trip_documents')
        .select('document_type');

      const documentsByType: Record<string, number> = {};
      documentTypes?.forEach(doc => {
        documentsByType[doc.document_type] = (documentsByType[doc.document_type] || 0) + 1;
      });

      // Шаблоны
      const { count: totalTemplates } = await supabase
        .from('document_templates')
        .select('*', { count: 'exact', head: true });

      const { count: activeTemplates } = await supabase
        .from('document_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Документы за текущий месяц
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const { count: documentsThisMonth } = await supabase
        .from('trip_documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString());

      // Среднее количество документов на рейс
      const { count: totalTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true });

      const averageDocumentsPerTrip = totalTrips && totalDocuments 
        ? Math.round((totalDocuments / totalTrips) * 10) / 10 
        : 0;

      // Примерная оценка завершенности (упрощенная)
      const tripCompletionRate = totalTrips && totalTemplates 
        ? Math.min(100, Math.round((totalDocuments || 0) / (totalTrips * Math.max(1, totalTemplates || 1)) * 100))
        : 0;

      return {
        totalDocuments: totalDocuments || 0,
        documentsByType,
        totalTemplates: totalTemplates || 0,
        activeTemplates: activeTemplates || 0,
        documentsThisMonth: documentsThisMonth || 0,
        averageDocumentsPerTrip,
        tripCompletionRate
      };
    },
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const documentTypeLabels: Record<string, string> = {
    'act': 'Акты',
    'invoice': 'Счета',
    'receipt': 'Квитанции',
    'contract': 'Договоры',
    'transport_waybill': 'ТТН',
    'customs_declaration': 'Таможенные',
    'insurance': 'Страховые',
    'certificate': 'Сертификаты',
    'permit': 'Разрешения',
    'other': 'Прочие'
  };

  return (
    <div className="space-y-6">
      {/* Основная статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего документов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              За этот месяц: +{stats.documentsThisMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Шаблоны документов</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Активных: {stats.activeTemplates}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее на рейс</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDocumentsPerTrip}</div>
            <p className="text-xs text-muted-foreground">
              документов на рейс
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Завершенность</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tripCompletionRate}%</div>
            <Progress value={stats.tripCompletionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Распределение по типам документов */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение документов по типам</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.documentsByType).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Документы еще не загружены</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.documentsByType)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {documentTypeLabels[type] || type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (count / stats.totalDocuments) * 100)}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Рекомендации */}
      {stats.tripCompletionRate < 80 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Рекомендации по документообороту
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700 dark:text-orange-300">
            <ul className="space-y-2 text-sm">
              {stats.activeTemplates === 0 && (
                <li>• Создайте шаблоны обязательных документов для рейсов</li>
              )}
              {stats.averageDocumentsPerTrip < 2 && (
                <li>• Увеличьте количество загружаемых документов на рейс</li>
              )}
              {stats.tripCompletionRate < 50 && (
                <li>• Настройте автоматические напоминания о загрузке документов</li>
              )}
              <li>• Проведите обучение сотрудников работе с системой документооборота</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
