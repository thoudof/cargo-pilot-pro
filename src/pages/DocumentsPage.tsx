import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Search } from 'lucide-react';
import { documentTypeLabels, DocumentType } from '@/types/documents';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface TripDocumentWithTrip {
  id: string;
  document_name: string;
  document_type: DocumentType;
  file_url?: string;
  file_size?: number;
  description?: string;
  upload_date: string;
  trip_id: string;
  trips: {
    point_a: string;
    point_b: string;
    departure_date: string;
  };
}

export const DocumentsPage: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['trip-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_documents')
        .select(`
          id,
          document_name,
          document_type,
          file_url,
          file_size,
          description,
          upload_date,
          trip_id,
          trips!inner (
            point_a,
            point_b,
            departure_date
          )
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data as TripDocumentWithTrip[];
    },
  });

  const handleDownload = (document: TripDocumentWithTrip) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else {
      toast.error('Файл недоступен для скачивания');
    }
  };

  const filteredDocuments = documents?.filter(doc => {
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    const matchesSearch = !searchTerm || 
      doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.trips.point_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.trips.point_b.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} МБ`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Документы рейсов</h1>
        <p className="text-muted-foreground">Просмотр всех загруженных документов</p>
      </div>

      {/* Фильтры */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип документа</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип документа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Поиск</Label>
              <Input
                placeholder="Поиск по названию или маршруту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список документов */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Документы не найдены</p>
                <p className="text-muted-foreground">Попробуйте изменить фильтры поиска</p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments?.map((document) => (
              <Card key={document.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-medium">{document.document_name}</h3>
                        <Badge variant="secondary">
                          {documentTypeLabels[document.document_type]}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>
                          <strong>Рейс:</strong> {document.trips.point_a} → {document.trips.point_b}
                        </div>
                        <div>
                          <strong>Дата рейса:</strong> {format(new Date(document.trips.departure_date), 'dd.MM.yyyy', { locale: ru })}
                        </div>
                        <div>
                          <strong>Загружен:</strong> {format(new Date(document.upload_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </div>
                        {document.file_size && (
                          <div>
                            <strong>Размер:</strong> {formatFileSize(document.file_size)}
                          </div>
                        )}
                        {document.description && (
                          <div>
                            <strong>Описание:</strong> {document.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        disabled={!document.file_url}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Скачать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};